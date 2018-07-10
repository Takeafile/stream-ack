const {Readable, Transform, Writable} = require('stream')

const Sender = require('..')


test('basic', function(done)
{
  const sended = {data: 'asdf', id: 0}

  let step = 0

  const duplex = new Transform({
    objectMode: true,
    transform(chunk, _, callback)
    {
      switch(step)
      {
        case 0:
          expect(chunk).toBe(sended)

          expect(sender._sended.get('0')).toEqual(sended)

          step++
        break;

        default:
          expect(chunk).toBe('ack0')

          setImmediate(function()
          {
            expect(sender._sended.size).toBe(0)

            done()
          })
      }

      callback(null, chunk)
    }
  })

  const sender = new Sender(duplex)

  sender.write(sended)

  sender.pipe(Sender.receiver(duplex))
  .on('data', function(data)
  {
    expect(data).toBe(sended)
  })
})

describe('Duplex closed', function()
{
  const sended = {data: 'asdf', id: 0}

  test('No src stream', function(done)
  {
    const sender = new Sender(new Writable({
      objectMode: true,
      write(chunk)
      {
        expect(chunk).toBe(sended)

        this.destroy()
      }
    }))

    sender.write(sended)

    sender.on('error', function(error)
    {
      expect(error).toBeInstanceOf(ReferenceError)
      expect(error.message).toBe("`src` stream not found, can't unshift chunks")

      done()
    })
  })

  test('Unshift to src stream', function(done)
  {
    const src = new Readable({
      objectMode: true,
      read(){}
    })

    const sender = new Sender(new Writable({
      objectMode: true,
      write(chunk)
      {
        expect(chunk).toBe(sended)

        this.destroy()
      }
    }))
    .on('close', function()
    {
      expect(src._readableState.buffer).toEqual({
        head: {"data": sended, "next": null},
        length: 1,
        tail: {"data": sended, "next": null}
      })

      done()
    })

    src.pipe(sender)

    sender.write(sended)
  })
})
