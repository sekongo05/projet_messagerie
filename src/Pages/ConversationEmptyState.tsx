import { CgAdd } from "react-icons/cg";

type ConversationEmptyStateProps = {
  theme?: 'light' | 'dark';
  isSearchResult?: boolean;
  onNewConversationClick?: () => void;
};

const ConversationEmptyState = ({
  theme = 'light',
  isSearchResult = false,
  onNewConversationClick,
}: ConversationEmptyStateProps) => {
  if (isSearchResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-lg">Aucune conversation trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
      <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-lg mb-4">Aucune conversation</p>
        <p className="text-sm mb-6">Commencez une nouvelle conversation</p>
      </div>
      {onNewConversationClick && (
        <button
          onClick={onNewConversationClick}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-orange-400 hover:bg-orange-500 text-white'
          } shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
        >
          <CgAdd className="w-5 h-5" />
          <span>Nouvelle conversation</span>
        </button>
      )}
    </div>
  );
};

export default ConversationEmptyState;
