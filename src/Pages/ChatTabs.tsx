import { CgComment, CgUserList } from "react-icons/cg";
import { FiUsers } from "react-icons/fi";

type ChatTabsProps = {
  activeTab: 'all' | 'prive' | 'contacts' | 'groupe';
  onTabChange: (tab: 'all' | 'prive' | 'contacts' | 'groupe') => void;
  theme?: 'light' | 'dark';
};

const ChatTabs = ({
  activeTab,
  onTabChange,
  theme = 'light',
}: ChatTabsProps) => {
  return (
    <div className='flex items-center gap-1'>
      <div 
        className={`group relative px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 text-sm font-medium flex items-center gap-2 ${
          activeTab === 'prive' 
            ? theme === 'dark' 
              ? 'bg-gray-900 text-orange-400 shadow-lg shadow-orange-500/20' 
              : 'bg-gray-100 text-orange-500 shadow-lg shadow-orange-200/50'
            : theme === 'dark' 
              ? 'text-gray-400 hover:text-orange-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:shadow-lg hover:shadow-orange-500/20' 
              : 'text-gray-600 hover:text-orange-500 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:shadow-lg hover:shadow-orange-200/50'
        }`}
        onClick={() => onTabChange('prive')}
      >
        <div className={`absolute inset-0 rounded-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
            : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
        } transition-all duration-300`} />
        <CgComment className="w-4 h-4 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
        <span className="relative z-10">Privé</span>
      </div>
      <div 
        className={`group relative px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 text-sm font-medium flex items-center gap-2 ${
          activeTab === 'groupe' 
            ? theme === 'dark' 
              ? 'bg-gray-900 text-orange-400 shadow-lg shadow-orange-500/20' 
              : 'bg-gray-100 text-orange-500 shadow-lg shadow-orange-200/50'
            : theme === 'dark' 
              ? 'text-gray-400 hover:text-orange-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:shadow-lg hover:shadow-orange-500/20' 
              : 'text-gray-600 hover:text-orange-500 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:shadow-lg hover:shadow-orange-200/50'
        }`}
        onClick={() => onTabChange('groupe')}
      >
        <div className={`absolute inset-0 rounded-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
            : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
        } transition-all duration-300`} />
        <FiUsers className="w-4 h-4 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
        <span className="relative z-10">Groupe</span>
      </div>
      <div 
        className={`group relative px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 text-sm font-medium ml-auto flex items-center gap-2 ${
          activeTab === 'contacts' 
            ? theme === 'dark' 
              ? 'bg-gray-900 text-orange-400 shadow-lg shadow-orange-500/20' 
              : 'bg-gray-100 text-orange-500 shadow-lg shadow-orange-200/50'
            : theme === 'dark' 
              ? 'text-gray-400 hover:text-orange-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:shadow-lg hover:shadow-orange-500/20' 
              : 'text-gray-600 hover:text-orange-500 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:shadow-lg hover:shadow-orange-200/50'
        }`}
        onClick={() => onTabChange('contacts')}
      >
        <div className={`absolute inset-0 rounded-xl ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
            : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
        } transition-all duration-300`} />
        <CgUserList className="w-4 h-4 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
        <span className="relative z-10">Contacts</span>
      </div>
    </div>
  );
};

export default ChatTabs;
