## Partyworks: A Multiplayer Framework for Partykit

_Please note: I am not affiliated with the partykit team._

**Partyworks** is an innovative framework designed for creating multiplayer applications using [partykit](https://github.com/partykit/partykit) 🎈. Inspired by [liveblocks](https://github.com/liveblocks/liveblocks), it aims to combine the power of `liveblocks` with custom code for a unique development experience.

### Key Features Currently in Development:

- **Presence API**
- **Broadcast Capabilities**
- **Custom Events Support**
- **Bot API**
- _Documentation coming soon_

### Current Status

Partyworks is currently in the development phase:

- **Dev**: Actively evolving with new features and APIs that might experience breaking changes.
- ~~Alpha~~: Some features are missing, and there might be bugs that require fixing.
- ~~Beta~~: Stable APIs, with final features being integrated.
- ~~General Availability~~: Ready for production usage.

### Examples Showcasing Partyworks

| Folder                              | Description                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| _examples/connection-status_        | Demonstrates live socket connection status and a lost connection toast notification. [Live Example](https://partyworks-connection-status.vercel.app/) |
| _examples/game-connect4_            | Connect4 game example. [Live Example](https://partyworks-game-connect4.vercel.app/)                                                                   |
| _examples/game-rock-paper-scissors_ | Rock, Paper, Scissors game example. [Live Example](https://partyworks-rock-paper-scissors.vercel.app/)                                                |
| _examples/game-tic-tac-toe_         | Tic-Tac-Toe game example. [Live Example](https://partyworks-game-tic-tac-toe.vercel.app/)                                                             |
| examples/group-chat                 | Live group chat (Work in Progress). [Live Example](https://partyworks-group-chat-3ocd7niko-partyworks.vercel.app/)                                    |
| _examples/live-cursors_             | Live cursors example (Work in Progress).                                                                                                              |

### Motivation & Story Behind Partyworks

During the development of my multiplayer game room project, [funrooms.io](https://funrooms.io), on [Cloudflare Workers](https://workers.cloudflare.com/), I encountered several challenges like socket reconnections, broadcast issues, managing presence, and custom event setups. I wished for a better alternative. Having previously used **liveblocks** and admired their API and developer experience, I found that it lacked support for custom backend code, which led me to discover **partykit**. With its superior developer experience compared to Cloudflare Workers and a supportive community, I decided to develop a library on top of it. Initially intended for personal use, the library evolved into something I'd like to share because, after all, "everything's better with friends" 🎈.

### Meet the Party Guy

Hey there, I'm **Shivam**! I'm deeply passionate about the multiplayer, collaboration, and gaming space. Presently, I'm working on **Partyworks** and **funrooms.io**. In the past, I've implemented my [own CRDT](https://github.com/dev-badace/live-text-crdt) based on Yata (the same as Yjs). Wishing you a fantastic day! 😁

(Pssst... I'm currently looking for new opportunities!)
