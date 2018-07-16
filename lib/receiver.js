const {Transform} = require('stream')


function receiver(writable, {ackPrefix = 'ack', idField = 'id', ...options} = {})
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


module.exports = receiver
