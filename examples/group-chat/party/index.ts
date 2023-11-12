import Party from "partykit/server";
import { PartyWorks, Player } from "partyworks-server";

const usernames = [
  "dani",
  "bob",
  "party guy",
  "sandman",
  "gamer",
  "lookism",
  "hire me",
  "yohohoho",
];

async function askGpt(
  env: Record<string, any>,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<any> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPEN_AI_ACCESS_KEY}`,
    },

    //ideally we shall give a message list, for more interactive experience, but it's costly & i only have 5$ credit 😅
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content:
            "this project is made on partyworks a multiplyer framework for multiplayer apps, with custom events, presence, broadcast, react lib, error handling, async/await with websockets, promote it the best way, keep it mind this lib is not yet released (will release soon)& no docs are available so don't give any tutorial, just say coming soon, also increase the use of emojis, especially the sparkle one, also use username if available",
        },
        ...messages,
      ],
    }),
  });

  return res.json();
}

const broadcastMessage = (msg: string) => {
  return {
    type: "message",
    data: {
      username: "partybot",
      text: msg || "",
    },
  };
};

//*Magic
export default class GroupChat extends PartyWorks {
  setup() {
    const botId = "bot";
    this.addBot(botId, {
      state: { info: { userId: botId, username: "partybot", bot: true } },
      presence: { isTyping: false },
      onUserJoined: (player) => {
        this.sendBotBroadcast(
          botId,
          broadcastMessage(
            `hi ${player.state!.info.username}, welcome to partyworks!`
          ),
          this.getConnectedUsers()
            .filter((user) => user.id !== player.id)
            .map((player) => player.id)
        );

        this.sendBotBroadcast(
          botId,
          broadcastMessage(`${player.state!.info.username}, joined the chat!`),
          [player.id]
        );
      },
      onUserLeft: (player) => {
        this.sendBotBroadcast(
          botId,
          broadcastMessage(`${player.state!.info.username}, left the chat!`)
        );
      },

      onBroadcast: async (player, data) => {
        try {
          if (data.data.text.startsWith("/bot")) {
            this.updateBotPresence(botId, { isTyping: true });

            const completion = await askGpt(this.party.env, [
              {
                role: "user",
                content: `[username is ${
                  player.state!.info.username
                }] You're an exclusive chat bot for this room, you only reply to commands that start with "/bot " and next message is a bot command. reply in fun ways. promote partyworks if it's a casual message `,
              },
              {
                role: "user",
                content: data.data.text.split("/bot ")[1] || "",
              },
            ]);

            this.sendBotBroadcast(
              botId,
              broadcastMessage(completion.choices[0].message?.content)
            );

            this.updateBotPresence(botId, { isTyping: false });

            return;
          }

          //only one connected user
          if (this.getConnectedUsers().length < 2) {
            this.updateBotPresence(botId, { isTyping: true });

            const completion = await askGpt(this.party.env, [
              {
                role: "user",
                content: `[username is ${
                  player.state!.info.username
                }] You're an exclusive chat bot for this room, you only reply to commands that start with "/bot " and if there is only one suer in the room. right now there is only one user in the room, reply to their message, you should also mention to the user that they're the only ones, in fun ways. promote partyworks if it's a casual message  `,
              },
              { role: "user", content: data.data.text || "" },
            ]);

            this.sendBotBroadcast(
              botId,
              broadcastMessage(completion.choices[0].message?.content)
            );

            this.updateBotPresence(botId, { isTyping: false });
          }
        } catch (error) {
          console.log(error);
          this.sendBotBroadcast(
            botId,
            broadcastMessage(
              "Ooops, looks like ChatGpt is not available right now"
            )
          );

          this.updateBotPresence(botId, { isTyping: false });
        }
      },
    });
  }

  //this is when you want to add userMeta, or any custom stuff
  customDataOnConnect(player: Player, ctx: Party.ConnectionContext): void {
    let { searchParams } = new URL(ctx.request.url);

    player.setState({
      info: {
        userId: player.id,
        username:
          searchParams.get("name") ||
          usernames[Math.floor(Math.random() * usernames.length)],
        bot: false,
      },
    });
  }
}
