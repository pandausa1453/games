import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

export function MessagingUI() {
  const rooms = useQuery(api.messages.listRooms) ?? [];
  const [selectedRoom, setSelectedRoom] = useState<Id<"rooms"> | undefined>(undefined);
  const messages = useQuery(api.messages.list, { roomId: selectedRoom }) ?? [];
  const sendMessage = useMutation(api.messages.send);
  const createRoom = useMutation(api.messages.createRoom);
  const joinRoom = useMutation(api.messages.joinRoom);
  
  const [newMessage, setNewMessage] = useState("");
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage) return;

    try {
      await sendMessage({
        content: newMessage,
        roomId: selectedRoom,
      });
      
      setNewMessage("");
      toast.success("Message sent!");
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoomName) return;

    try {
      const { roomId, code } = await createRoom({ name: newRoomName });
      setSelectedRoom(roomId);
      setShowRoomDialog(false);
      setNewRoomName("");
      toast.success(`Room created! Share code: ${code}`);
    } catch (error) {
      toast.error("Failed to create room");
      console.error(error);
    }
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode) return;

    try {
      const roomId = await joinRoom({ code: joinCode.toUpperCase() });
      setSelectedRoom(roomId);
      setShowRoomDialog(false);
      setJoinCode("");
      toast.success("Joined room!");
    } catch (error) {
      toast.error("Failed to join room");
      console.error(error);
    }
  }

  return (
    <div className="mt-8 max-w-4xl mx-auto">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setSelectedRoom(undefined)}
          className={`px-4 py-2 rounded ${
            selectedRoom === undefined ? 'bg-indigo-500 text-white' : 'bg-gray-100'
          }`}
        >
          Global Chat
        </button>
        {rooms.map(room => (
          <button
            key={room._id}
            onClick={() => setSelectedRoom(room._id)}
            className={`px-4 py-2 rounded ${
              selectedRoom === room._id ? 'bg-indigo-500 text-white' : 'bg-gray-100'
            }`}
          >
            {room.name}
          </button>
        ))}
        <button
          onClick={() => setShowRoomDialog(true)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          + New Chat
        </button>
      </div>

      {showRoomDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Private Chat</h3>
            
            <form onSubmit={handleCreateRoom} className="mb-4">
              <input
                type="text"
                placeholder="Enter chat name..."
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <button
                type="submit"
                disabled={!newRoomName}
                className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
              >
                Create New Chat
              </button>
            </form>

            <div className="text-center text-gray-500 my-4">or</div>

            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Enter chat code..."
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                className="w-full p-2 border rounded mb-2"
              />
              <button
                type="submit"
                disabled={!joinCode}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
              >
                Join Existing Chat
              </button>
            </form>

            <button
              onClick={() => setShowRoomDialog(false)}
              className="w-full px-4 py-2 mt-4 border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">
          {selectedRoom === undefined ? "Global Chat Room" : rooms.find(r => r._id === selectedRoom)?.name}
        </h3>
        
        <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto">
          {messages.map(msg => (
            <div key={msg._id} className="border rounded p-3">
              <div className="text-sm text-gray-600 mb-1">
                {msg.authorEmail}
                <span className="mx-2">•</span>
                {new Date(msg._creationTime).toLocaleTimeString()}
              </div>
              <p>{msg.content}</p>
            </div>
          )).reverse()}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={!newMessage}
            className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
