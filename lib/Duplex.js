const duplexify = require('duplexify').obj

const Confirm = require('./Confirm')
const Sender  = require('./Sender')


function ACK(duplex, {confirm: confirmOptions, sender: senderOptions, ...options} = {})
{
  const inFlight = new Map

  const confirm = new Confirm(duplex, inFlight, confirmOptions)
  const sender  = new Sender (duplex, inFlight, senderOptions)

  const result = duplexify(sender, confirm, options)

  result._inFlight = inFlight

  return result
}


module.exports = ACK
