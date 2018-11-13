const {Readable} = require('stream')


class Confirm extends Readable
{
  constructor(duplex, inFlight, {ackPrefix = 'ack', idField = 'id', ...options} = {})
  {
    super({...options, objectMode: true})

    const regExp = new RegExp(`${ackPrefix}(.+)`)

    duplex
    .on('data', data =>
    {
      if(typeof data === 'string')
      {
        const match = data.match(regExp)

        if(match)
        {
          const [, id] = match

          this.emit('landed', id, inFlight.get(id))
          inFlight.delete(id)

          if(!inFlight.size) this.emit('allLanded')

          return
        }
      }

      if(!this.push(data)) duplex.pause()
    })
    .once('end', this.push.bind(this, null))

    this._duplex = duplex
  }

  _read()
  {
    this._duplex.resume()
  }
}


module.exports = Confirm
