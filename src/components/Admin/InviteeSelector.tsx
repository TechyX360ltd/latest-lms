import React, { useState } from 'react';

interface Learner {
  id: string;
  name: string;
  email: string;
}

interface InviteeSelectorProps {
  learners: Learner[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function InviteeSelector({ learners, selected, onChange }: InviteeSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = learners.filter(
    l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(l => selected.includes(l.id));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter(id => !filtered.some(l => l.id === id)));
    } else {
      onChange([...selected, ...filtered.map(l => l.id).filter(id => !selected.includes(id))]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Invite Learners</label>
      <input
        type="text"
        placeholder="Search learners..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-2"
      />
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="accent-blue-600"
        />
        <span className="ml-2 text-sm">Select All</span>
      </div>
      <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
        {filtered.length === 0 && (
          <div className="text-gray-400 text-sm">No learners found.</div>
        )}
        {filtered.map(learner => (
          <label key={learner.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(learner.id)}
              onChange={() => toggle(learner.id)}
              className="accent-blue-600"
            />
            <span>{learner.name} <span className="text-gray-400">({learner.email})</span></span>
          </label>
        ))}
      </div>
      {/* Chips for selected learners */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map(id => {
            const learner = learners.find(l => l.id === id);
            return learner ? (
              <span
                key={id}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
              >
                {learner.name}
                <button
                  type="button"
                  className="ml-1 text-blue-600 hover:text-blue-900"
                  onClick={() => toggle(id)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
} 