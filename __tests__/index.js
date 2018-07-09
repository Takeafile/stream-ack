const {Readable, Transform, Writable} = require('stream')

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
  })
})

describe('Duplex closed', function()
{
  const sended = {data: 'asdf', id: 0}

  test('No src stream', function(done)
  {
    const ack = new ACK(new Writable({
      objectMode: true,
      write(chunk)
      {
        expect(chunk).toBe(sended)

        this.destroy()
      }
    }))

    ack.write(sended)

    ack.on('error', function(error)
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

    const ack = new ACK(new Writable({
      objectMode: true,
      write(chunk)
      {
        expect(chunk).toBe(sended)

        this.destroy()

        this.on('close', function()
        {
          expect(src._readableState.buffer).toEqual({
            head: {"data": sended, "next": null},
            length: 1,
            tail: {"data": sended, "next": null}
          })

          done()
        })
      }
    }))

    src.pipe(ack)

    ack.write(sended)
  })
})
