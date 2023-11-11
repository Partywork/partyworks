export enum PartyworksEvents {
  //* Batching
  BATCH = 0, //batched messages

  //* Presence Types
  USER_JOINED = 1, //whe  a user joins the room
  USER_LEFT = 2, //when a user leaves the room
  PRESENSE_UPDATE = 3, //when a user sends a presense update event
  USERMETA_UPDATE = 4, //when the server updates a user's meta

  //* Sending the Room State to the user.
  //* this includes. the empheral/live state like presence. as well as the storage state of the room
  ROOM_STATE = 10, //this is a get message. or a automatic server sent messsage on connection startup

  //*Broadcast
  BROADCAST = 20, // a message broadcasted by the user

  //*Custom Event
  EVENT = 30, //a custom event by the user
}

export const PARTYWORKS_UNDEFINED_PLACEHOLDER = "_";
