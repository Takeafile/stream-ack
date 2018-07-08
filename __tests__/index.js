const {Transform} = require('stream')

const ACK = require('..')


test('basic', function(done)
{
  const sended = {data: 'asdf', id: 0}

  let step = 0

  const ack = new ACK(new Transform({
    objectMode: true,
    transform(chunk, _, callback)
    {
      switch(step)
      {
        case 0:
          expect(chunk).toBe(sended)

          expect(ack._sended).toEqual({0: sended})

          step++
        break;

        default:
          expect(chunk).toBe('ack0')

          setImmediate(function()
          {
            expect(ack._sended).toEqual({})

            done()
          })
      }

      callback(null, chunk)
    }
  }))

  ack.write(sended)

  ack.on('data', function(data)
  {
    expect(data).toBe(sended)

//    step++
  })
})
