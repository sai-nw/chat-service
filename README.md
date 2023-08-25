## Customer service chat

- Dynamic Channel Rule
- Message Status
- Connection
- Initialize Chat
- Active Status
- Typing
- Send Message
- Receive Message
- Message List
- Leave Message Chat Room
- Receive Message For Conversation  List
- Block
- Unblock
- Remove Message

### Dynamic Channel Rule

- There are two user Ids (send user Id and receive user Id)
- Dynamic channel name should be follow "greaterUserId-lessUserId-name"
- eg - "32-15-display"

### Message Status
- 1 => sent
- 2 => delivered
- 3 => seen

### Connection

<b>Domain</b> - http://dev1.domain.com

Connect Options

| Name   | Type    | Required | Value                         |
| ------ | ------- | -------- | ----------------------------- |
| path   | String  | Yes      | '/projectName/chat/socket.io'     |
| secure | Boolean | Yes      | true                          |
| query  | Object  | Yes      | { token: ' <access_token>'  } |

Example

```javascript
socket = io.connect('https://domain.com',{
      path:'/chat/socket.io', 
      secure:true, 
      query:{token : '<access_token>'});
    };
```

### Initialize Chat

<b>Channel Name</b> - "init-chat"

Event Type - Emit

Callback - true

Request Body

| Name       | Type | Required |
| ---------- | ---- | -------- |
| receiverId | Int  | Yes      |

Response Sample

```javascript
{
  "lastActiveAt": "2020-11-20 02:46:23",
  "isFirstTime": true,
  "isBlock": false,
  "blockBy" : 30 {userId}
}
```

### Active Status

<b>Channel Name</b> -  "greaterUserId-lessUserId-show-active-status "

Channel Type - Dynamic

Event Type - On

ACK Response Sample

```javascript
{
  "lastActiveAt": "2020-11-20 02:46:23"
}

or 

{
  "lastActiveAt": null
}
```

### Typing

<b>Channel Name</b> - "typing" 

Event Type - Emit

Request

| Name       | Type    | Required |
| ---------- | ------- | -------- |
| typing     | Boolean | Yes      |
| receiverId | Int     | Yes      |

<b>Channel Name</b> - "greaterUserId-lessUserId-display "

Channel Type - Dynamic

Event Type - On

ACK Response Sample

```javascript
{
  typing: true,
  senderId: 32,
  receiverId: 12
}
```

### Send Message

<b>Channel Name</b> - "send-message"

Event Type - Emit

Callback - true

Request

| Name       | Type      | Required |
| ---------- | --------- | -------- |
| image      | String () | Optional |
| message    | String    | Optional |
| receiverId | Int       | Yes      |

ACK Response Sample To Sender

```javascript
{
    id: "5fbc7bacb6ab631365585c69",
    message: 'Good Bye',
    image: null,
    status: '2',
    senderId: 27,
    receiverId: 3,
    messageAt: '2020-11-24 09:49:08'
}
```

### Receive Message

<b>Channel Name</b> - "greaterUserId-lessUserId-message-received"

Channel Type - Dynamic

Event Type - On

ACK Response Sample

```javascript
{
      id: "5fbb96ac042a611c7f34b323",
      message: '',
      image: 'http://127.0.0.1:8001/assets/messages/1606129324508.png',
      status: '2',
      senderId: 3,
      receiverId: 27,
      messageAt: '2020-11-23 11:02:04'
}
```

### Messages List

<b>Channel Name</b> - "get-messages"

Event Type - Emit

Callback - True

Request

| Name           | Type    | Required        |
| -------------- | ------- | --------------- |
| nextMessageId  | String  | Yes (Default 0) |
| receiverId     | Int     | Yes             |

ACK Response Sample

```javascript
{
  messages: [
    {
      id: "5fbb96ac042a611c7f34b323",
      message: '',
      image: 'http://127.0.0.1:8001/assets/messages/1606129324508.png',
      status: '2',
      senderId: 3,
      receiverId: 27,
      messageAt: '2020-11-23 11:02:04'
    },
    {
      id: "5fbb7b331c94585f853dd537",
      message: 'Test',
      image: null,
      status: '1',
      senderId: 27,
      receiverId: 3,
      messageAt: '2020-11-23 09:04:51'
    },
    {
      id: "5fbb75aeaeed815d6f5c6c96",
      message: 'Testing',
      image: null,
      status: '1',
      senderId: 27,
      receiverId: 3,
      messageAt: '2020-11-23 08:41:18'
    },
    ....
  ],
  nextMessageId: "5fb771f14a0fdd53bdc7a5db"
}
```



<h3>Leave Message Chat Room</h3>

<b>Channel Name</b> - "leave-chatroom"

Event Type - Emit

Callback - False



<h3>Receive Message For Conversation  List</h3>

<b>Channel Name</b> - "message-received"

Event Type - On

Sample Message

```javascript
{
  id: "5fbc9386d6d21b7a2821c558",
  activeStatus: true,
  unreadMessagesCount: 3,
  user: { id: 99, name: 'bms', profile: 'http://127.0.0.1:8001/assets/uaa/profile/fake-profile.png' },
  lastMessage: {
    isSender: true,
    message: 'erw',
    image: null,
    messageAt: '2020-11-24 11:30:54'
  }
}
```

### Block User

<b>Channel Name</b> - "block-user"

Event Type - Emit

Callback - True

| Name    | Des     | Type | Required |
| ------- | ------- | ---- | -------- |
| blockTo | User Id | Int  | Yes      |

ACK Response Sample

```javascript
{
  "message": "success"
}
or
{
  "message": "fail"
}
```

### Unblock User

<b>Channel Name</b> - "unblock-user"

Event Type - Emit

Callback - True

| Name      | Des     | Type | Required |
| --------- | ------- | ---- | -------- |
| unBlockTo | User Id | Int  | Yes      |

ACK Response Sample

```javascript
{
  "message": "success"
}
or
{
  "message": "fail"
}
```

### Block-Unblock

<b>Channel Name</b> - "greaterUserId-lessUserId-block-unblock"

Channel Type - Dynamic

Event Type - On

ACK Response Sample

```javascript
{ 
    "status": true 
}
or
{ 
    "status": false 
}
```

### Remove Message

<b>Channel Name</b> - "remove-message"

Event Type - Emit

Callback - True

Request

| Name           | Type   | Required |
| -------------- | ------ | -------- |
| messageId      | String | Yes      |
| receiverId     | Int    | Yes      |

ACK Response Sample

```javascript
{
  "message": "success"
}
or
{
  "message": "fail"
}
```
<b>Channel Name</b> - "greaterUserId-lessUserId-message-removed"

Channel Type - Dynamic

Event Type - On

ACK Response Sample

```javascript
{
  messageId: "5ff3e7ffb4106d7dad887919"
}
```
