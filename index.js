const {Duplex, Transform} = require('stream')


class Sender extends Duplex
{
  constructor(duplex, {ackPrefix = 'ack', idField = 'id', ...options} = {})
  {
    super({...options, objectMode: true})

    const regExp = new RegExp(`${ackPrefix}(.+)`)

    const sended = new Map

    this
    .once('close', () =>
    {
      const {_src} = this

      if(!sended.size) return

      if(!_src) return this.emit('error',
        new ReferenceError("`src` stream not found, can't unshift chunks"))

      _src.unpipe(this)
    })
    .on('pipe', src =>
    {
      if(this._src) return this.emit('error',
        new ReferenceError("Can't pipe from more than one `src` stream"))

      this._src = src
    })
    .on('unpipe', () =>
    {
      const {_src} = this

      delete this._src

      for(const [id, value] of Array.from(inFlight.entries()).reverse())
        _src.unshift(value)

      sended.clear()
    })

    duplex
    .once('close', this.emit.bind(this, 'close'))
    .on('data', data =>
    {
      if(typeof data === 'string')
      {
        const match = data.match(regExp)

        if(match) return sended.delete(match[1])
      }

      if(!this.push(data)) duplex.pause()
    })
    .on('drain', process.nextTick.bind(process, this.uncork.bind(this)))
    .on('error', this.emit.bind(this, 'error'))
    .once('finish', this.end.bind(this))

    this._duplex  = duplex
    this._idField = idField
    this._sended  = sended
  }

  _read()
  {
    this._duplex.resume()
  }

  _write(chunk, _, callback)
  {
    const {_duplex, _idField, _sended} = this

    let id = chunk[_idField]
    if(id != null)
    {
      id = id.toString()

      if(_sended.has(id))
        return callback(new ReferenceError('Duplicated chunk ID'))

      _sended.set(id, chunk)
    }

    if(!_duplex.write(chunk)) this.cork()

    callback()
  }
}


Sender.receiver = function(writable, {ackPrefix = 'ack', idField = 'id', ...options} = {})
{
  if(!writable.writable) throw TypeError('`writable` stream is not writable')

  return new Transform({
    ...options,
    objectMode: true,
    transform(chunk, _, callback)
    {
      // Not checking if `writable` accept more data doesn't hurt too much here
      const id = chunk[idField]
      if(id != null) writable.write(`${ackPrefix}${id}`)

      callback(null, chunk)
    }
  })
}


module.exports = Sender
