import { useState } from "react";
import type {ChangeEvent, FormEvent} from "react";
import { FiImage } from "react-icons/fi";

interface MessageInputProps {
  conversationId: number;
  userId: number;
  onSend: (formData: FormData) => Promise<void>;
  theme?: 'light' | 'dark';
  onError?: (message: string) => void;
  onWarning?: (message: string) => void;
}

const MessageInput = ({
  conversationId,
  userId,
  onSend,
  theme = 'light',
  onError,
  onWarning,
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
      if (onWarning) {
        onWarning("Veuillez sélectionner une image");
      } else {
        alert("Veuillez sélectionner une image");
      }
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Envoi message
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!content.trim() && !image) {
      if (onWarning) {
        onWarning("Le message ne peut pas être vide");
      } else {
        alert("Le message ne peut pas être vide");
      }
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

  const borderColor = theme === 'dark' ? 'border-gray-900' : 'border-gray-300';
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const inputBg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const inputBorder = theme === 'dark' ? 'border-gray-800' : 'border-gray-300';
  const placeholderColor = theme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500';

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 p-3 border-t ${borderColor} ${bgColor}`}
    >
      {/* Input image */}
      <label className={`cursor-pointer ${theme === 'dark' ? 'text-gray-300 hover:text-orange-400' : 'text-gray-600 hover:text-orange-500'} transition-colors`}>
        <FiImage className="w-6 h-6" />
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
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs hover:bg-red-600 transition-colors"
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
        className={`flex-1 resize-none ${inputBorder} ${inputBg} ${textColor} ${placeholderColor} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
        rows={1}
      />

      {/* Bouton envoyer */}
      <button
        type="submit"
        disabled={loading}
        className="bg-orange-400 hover:bg-orange-500 cursor-pointer text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? "..." : "Envoyer"}
      </button>
    </form>
  );
};

export default MessageInput;