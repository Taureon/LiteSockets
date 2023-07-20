# Things to add:

- Packet Joining.
  - Instead of sending many small packets, the server/client can just send one large packet that has the small packets in it.
  - They can just be joined on the sender and the receiver would have to figure out what the packets were.

- Encryption.
  - Add Checksum bytes at the beginning of the packet or the packet chain, then encrypt, then send. Receiver decrypts, does checksum, then interprets.
  - "Use Asymetric Encryption" option switches from AES to RSA.
  - Keys would have to be provided, while for RSA it is optional and if it is not provided, it would just generate public and private keys.
