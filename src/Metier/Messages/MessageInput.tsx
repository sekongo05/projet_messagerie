import { useState } from "react";
import type {ChangeEvent, FormEvent} from "react"

interface MessageInputProps {
  conversationId: number;
  userId: number;
  onSend: (formData: FormData) => Promise<void>;
}

const MessageInput = ({
  conversationId,
  userId,
  onSend,
}: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Gestion du texte
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Gestion image
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sécurité : image uniquement
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Envoi message
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !image) {
      alert("Le message ne peut pas être vide");
      return;
    }

    const formData = new FormData();
    formData.append("conversationId", conversationId.toString());
    formData.append("user", userId.toString());

    if (content.trim()) {
      formData.append("content", content.trim());
    }

    if (image) {
      formData.append("file", image);
      formData.append("typeMessage", "2"); // IMAGE ou MIXED
    } else {
      formData.append("typeMessage", "1"); // TEXTE
    }

    try {
      setLoading(true);
      await onSend(formData);

      // Reset
      setContent("");
      setImage(null);
      setPreview(null);
    } catch (error) {
      console.error("Erreur envoi message", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 border-t"
    >
      {/* Input image */}
      <label className="cursor-pointer">
        📎
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </label>

      {/* Preview image */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="preview"
            className="w-12 h-12 object-cover rounded"
          />
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setPreview(null);
            }}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Écris un message..."
        className="flex-1 resize-none border rounded px-3 py-2"
        rows={1}
      />

      {/* Bouton envoyer */}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "..." : "Envoyer"}
      </button>
    </form>
  );
};

export default MessageInput;