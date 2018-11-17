[![Build Status](https://travis-ci.org/Takeafile/stream-ack.svg?branch=master)](https://travis-ci.org/Takeafile/stream-ack)
[![Coverage Status](https://coveralls.io/repos/github/Takeafile/stream-ack/badge.svg?branch=master)](https://coveralls.io/github/Takeafile/stream-ack?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/Takeafile/stream-ack.svg)](https://greenkeeper.io/)

# stream-ack

ACK data chunks send over a Node.js stream

This package allow to send and receive messages in a Node.js stream to confirm
that some data fragments has arrived to their destination, storing them until
the confirmation message is received. In case the transport stream gets closed
with some data fragment being confirmed, it's notified to the application so
they can be send using another transport stream.

# How it works

`Sender` stream will store written data chunks in a `Map` object used as cache.
When received by the `receiver` stream, a confirmation message is send back.
`Confirm` stream will receive it and remove the corresponding one from the cache
of sended data chunks,

# API

## Sender

- *writable*: `Writable` stream wrapped to send the data and ACK messages
- *inFlight*: `Map` object used to cache de data chunks pending for confirmation
- *options*: options passed to the underlying `Transform` stream
  - *idField*: field inside the incoming message that host the confirmation ID

## receiver

- *writable*: `Writable` stream where to write confirmation messages
- *options*: options passed to the underlying `Transform` stream
  - *ackPrefix*: prefix used to identify the ACK magic message
  - *idField*: field inside the incoming message that host the confirmation ID

## confirm

- *readable*: `Readable` stream wrapped to receive incoming ACK messages
- *inFlight*: `Map` object used to cache de data chunks pending for confirmation
- *options*: options passed to the underlying `Readable` stream
  - *ackPrefix*: prefix used to identify the ACK magic message

## duplex

- *duplex*: `Duplex` stream wrapped to send and receive data and ACK messages
- *options*: options passed to underlying `duplexify` stream object
  - *confirm*: options passed to underlying `Confirm` stream
  - *sender*: options passed to underlying `Sender` stream
