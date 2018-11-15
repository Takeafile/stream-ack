const duplexify = require('duplexify').obj

const Confirm = require('./Confirm')
const Sender  = require('./Sender')


function ACK(duplex, {confirm: confirmOptions, sender: senderOptions, ...options} = {})
{
  const value = new Map

  const confirm = new Confirm(duplex, value, confirmOptions)
  const sender  = new Sender (duplex, value, senderOptions)

  const result = duplexify(sender, confirm, options)

  Object.defineProperty(result, '_inFlight', {value})

  confirm.on('allLanded', result.emit.bind(result, 'allLanded'))
  confirm.on('landed', result.emit.bind(result, 'landed'))

  sender.on('allLanded', result.emit.bind(result, 'allLanded'))
  sender.on('inFlight', result.emit.bind(result, 'inFlight'))
  sender.on('landed', result.emit.bind(result, 'landed'))

  result.on('pipe', sender.emit.bind(sender, 'pipe'))
  result.on('unpipe', sender.emit.bind(sender, 'unpipe'))

  return result
}


module.exports = ACK
