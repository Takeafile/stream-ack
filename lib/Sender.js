const {Writable} = require('stream')


class Sender extends Writable
{
  constructor(duplex, inFlight, {idField = 'id', ...options} = {})
  {
    super({...options, objectMode: true})

    this
    .once('close', () =>
    {
      const {_src} = this

      if(!inFlight.size) return

      if(!_src) return this.emit('error',
        new ReferenceError("`src` stream not found, can't unshift chunks"))

      _src.unpipe(this)
    })
    .once('finish', duplex.end.bind(duplex))
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

      if(!inFlight.size) return

      for(const [id, value] of Array.from(inFlight.entries()).reverse())
      {
        this.emit('landed', id, value)
        _src.unshift(value)
      }

      inFlight.clear()
      this.emit('allLanded')
    })

    duplex
    .once('close', this.emit.bind(this, 'close'))
    .on('drain', process.nextTick.bind(process, this.uncork.bind(this)))
    .on('error', this.emit.bind(this, 'error'))

    this._duplex   = duplex
    this._idField  = idField
    this._inFlight = inFlight
  }

  _write(chunk, _, callback)
  {
    const {_duplex, _idField, _inFlight} = this

    let id = chunk[_idField]
    if(id != null)
    {
      id = id.toString()

      if(_inFlight.has(id))
        return callback(new ReferenceError('Duplicated chunk ID'))

      _inFlight.set(id, chunk)
      this.emit('inFlight', id, chunk)
    }

    if(!_duplex.write(chunk)) this.cork()

    callback()
  }
}


module.exports = Sender
