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
}
