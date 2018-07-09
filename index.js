const {Duplex} = require('stream')


function write(data)
{
  if(!this._duplex.write(data)) this.cork()
}


class ACK extends Duplex
{
  constructor(duplex, {ackPrefix = 'ack', idField = 'id', ...options} = {})
  {
    super({...options, objectMode: true})

    const regExp = new RegExp(`${ackPrefix}(.+)`)

    this._sended = {}

    this.on('pipe', src =>
    {
      if(this._src) return this.emit('error',
        new ReferenceError("Can't pipe from more than one `src` stream"))

      this._src = src
    })
    .on('unpipe', () => delete this._src)

    duplex.on('close', () =>
    {
      const {_sended, _src} = this

      const values = Object.values(_sended)
      if(!values.length) return

      if(!_src) return this.emit('error',
        new ReferenceError("`src` stream not found, can't unshift chunks"))

      _src.unpipe(this)

      for(const value of values.reverse()) _src.unshift(value)

      this._sended = {}
    })
    .on('data', data =>
    {
      if(typeof data === 'string')
      {
        const match = data.match(regExp)
        if(match)
        {
          delete this._sended[match[1]]

          return
        }
      }

      write.call(this, `${ackPrefix}${data[idField]}`)

      if(!this.push(data)) duplex.pause()
    })
    .on('drain', process.nextTick.bind(process, this.uncork.bind(this)))

    this._duplex  = duplex
    this._idField = idField
  }

  _read()
  {
    this._duplex.resume()
  }

  _write(chunk, _, callback)
  {
    const {_idField, _duplex, _sended} = this

    const id = chunk[_idField]

    if(_sended[id]) return callback(new ReferenceError('Duplicated chunk ID'))

    _sended[id] = chunk

    write.call(this, chunk)

    callback()
  }
}


module.exports = ACK
