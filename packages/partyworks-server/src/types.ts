import type * as Party from "partykit/server";

export interface Player<
  TState = any,
  TEvents extends Record<string, any> = {},
  TPresence = any
> extends Party.Connection<TState> {
  presence: TPresence;
  emit: <K extends keyof TEvents>(event: K, data: TEvents[K]) => void;
  sendData: <K extends keyof TEvents>(event: K, data: TEvents[K]) => void;
}

//lol for anyone wondering why the internaltypes are 0,1,2,4 and then 100,300 , i copied this from my funrooms project
// and that had alot more different events so ><

export enum InternalEvents {
  //* Connection
  CONNECT = 0, //SERVER ONLY

  //* Presence Types
  USER_JOINED = 1, //whe  a user joins the room
  USER_LEFT = 2, //when a user leaves the room

  //* Sending the Room State to the user.
  //* this includes. the empheral/live state like presence. as well as the storage state of the room
  ROOM_STATE = 4, //this is a get message. or a automatic server sent messsage on connection startup

  //*Broadcast
  BROADCAST = 100, // a message broadcasted by the user

  //* User
  PRESENSE_UPDATE = 300, //when a user sends a presense update event
  USERMETA_UPDATE = 301, //when the server updates a user's meta
}
