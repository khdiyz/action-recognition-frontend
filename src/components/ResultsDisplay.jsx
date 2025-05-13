import { Film, BarChart } from 'lucide-react';

const ResultsDisplay = ({ predictions }) => {
  if (!predictions || predictions.length === 0) {
    return <p className="text-slate-400 text-center py-4">Aniqlangan harakatlar mavjud emas.</p>;
  }

  return (
    <div className="space-y-3">
      {predictions.map((action, index) => {
        // Handle both the new format (object with label/confidence) and old format (string)
        const actionLabel = typeof action === 'string' ? action : action.label;
        const confidence = typeof action === 'string' ? null : action.confidence;
        
        return (
          <div
            key={index}
            className="bg-slate-700 p-4 rounded-lg shadow-md flex items-center hover:bg-slate-600/70 transition-colors duration-200"
          >
            <Film size={24} className="text-sky-400 mr-4 flex-shrink-0" />
            <div className="flex-grow">
              <p className="text-slate-200 text-lg">{actionLabel}</p>
              {confidence && (
                <div className="flex items-center mt-1">
                  <BarChart size={14} className="text-emerald-400 mr-1" />
                  <p className="text-emerald-400 text-sm">{confidence}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsDisplay;