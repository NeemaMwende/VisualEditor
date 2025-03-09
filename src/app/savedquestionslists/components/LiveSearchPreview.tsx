// import React, { useState, useEffect, useRef } from 'react';
// import { Search, X } from 'lucide-react';
// import { DashboardQuestion } from '../../components/Interfaces';

// const LiveSearchPreview = ({ questions }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filteredQuestions, setFilteredQuestions] = useState([]);
//   const [showPreview, setShowPreview] = useState(false);
//   const [highlightedQuestion, setHighlightedQuestion] = useState(null);
//   const searchRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setShowPreview(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setFilteredQuestions([]);
//       return;
//     }

//     const term = searchTerm.toLowerCase().trim();
//     const filtered = questions.filter(question => 
//       question.title.toLowerCase().includes(term) || 
//       question.question.toLowerCase().includes(term) ||
//       question.tags.some(tag => tag.toLowerCase().includes(term)) ||
//       question.answers.some(answer => answer.text.toLowerCase().includes(term))
//     );

//     setFilteredQuestions(filtered);
//   }, [searchTerm, questions]);

//   // Highlight matching text in content
//   const highlightMatch = (text, term) => {
//     if (!term.trim()) return text;
    
//     const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
//     const parts = text.split(regex);
    
//     return parts.map((part, i) => 
//       regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
//     );
//   };

//   return (
//     <div className="w-full max-w-2xl mx-auto relative" ref={searchRef}>
//       <div className="relative">
//         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
//           <Search className="w-5 h-5 text-gray-400" />
//         </div>
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           onFocus={() => setShowPreview(true)}
//           placeholder="Type to search questions and see content..."
//           className="w-full py-3 pl-10 pr-10 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//         />
//         {searchTerm && (
//           <button
//             className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
//             onClick={() => setSearchTerm('')}
//           >
//             <X className="w-5 h-5" />
//           </button>
//         )}
//       </div>
      
//       {showPreview && searchTerm.trim() && (
//         <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
//           {filteredQuestions.length === 0 ? (
//             <div className="p-4 text-center text-gray-500">
//               No questions match your search
//             </div>
//           ) : (
//             <div>
//               <div className="p-2 bg-gray-50 border-b border-gray-200 sticky top-0">
//                 <p className="text-sm text-gray-500">Found {filteredQuestions.length} matching questions</p>
//               </div>
//               <ul>
//                 {filteredQuestions.map(question => (
//                   <li 
//                     key={question.id}
//                     className="border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors"
//                     onMouseEnter={() => setHighlightedQuestion(question.id)}
//                   >
//                     <div className="p-3 cursor-pointer">
//                       <h4 className="font-medium text-blue-600">
//                         {highlightMatch(question.title, searchTerm)}
//                       </h4>
                      
//                       <div className="mt-2 text-sm">
//                         <div className="flex gap-2 flex-wrap">
//                           {question.tags.map(tag => (
//                             <span 
//                               key={`${question.id}-${tag}`} 
//                               className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
//                             >
//                               {highlightMatch(tag, searchTerm)}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
                      
//                       {highlightedQuestion === question.id && (
//                         <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
//                           <p className="font-medium mb-1">Question:</p>
//                           <p className="mb-2 whitespace-pre-wrap break-words">
//                             {highlightMatch(question.question, searchTerm)}
//                           </p>
                          
//                           <p className="font-medium mb-1">Answers:</p>
//                           <ul className="space-y-1 ml-4 list-disc">
//                             {question.answers.map((answer, index) => (
//                               <li 
//                                 key={`preview-${question.id}-${index}`}
//                                 className={answer.isCorrect ? 'text-green-600' : ''}
//                               >
//                                 {highlightMatch(answer.text, searchTerm)}
//                                 {answer.isCorrect && ' (Correct)'}
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       )}
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default LiveSearchPreview;