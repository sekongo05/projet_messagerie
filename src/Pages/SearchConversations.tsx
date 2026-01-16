import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

type SearchConversationsProps = {
  onSearchChange: (searchTerm: string) => void;
  theme?: 'light' | 'dark';
  placeholder?: string;
};

const SearchConversations = ({
  onSearchChange,
  theme = 'light',
  placeholder = 'Rechercher une conversation...',
}: SearchConversationsProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  const inputBg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const inputBorder = theme === 'dark' ? 'border-gray-800' : 'border-gray-200';
  const inputText = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const placeholderColor = theme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const iconColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`relative px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className={`w-5 h-5 ${iconColor}`} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 ${inputBg} ${inputBorder} ${inputText} ${placeholderColor} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm`}
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${iconColor} hover:${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} transition-colors`}
            type="button"
            aria-label="Effacer la recherche"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchConversations;
