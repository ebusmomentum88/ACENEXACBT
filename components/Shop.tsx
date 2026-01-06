
import React from 'react';
import { CandyToken } from './CandyToken';
import { playSound } from '../services/audio';
import Button from './Button';
import { Lock, Check } from 'lucide-react';

interface Props {
    tokens: number;
    onPurchase: (cost: number, itemId: string) => void;
    unlockedItems: string[];
    onClose: () => void;
}

const ITEMS = [
    { id: 'theme_blue', name: 'Blue Theme', cost: 0, color: 'bg-blue-500' },
    { id: 'theme_purple', name: 'Purple Power', cost: 50, color: 'bg-purple-500' },
    { id: 'theme_orange', name: 'Orange Crush', cost: 100, color: 'bg-orange-500' },
    { id: 'theme_pink', name: 'Pink Party', cost: 200, color: 'bg-pink-500' },
    { id: 'sticker_star', name: 'Super Star', cost: 300, color: 'bg-yellow-400' },
    { id: 'sticker_cool', name: 'Cool Cat', cost: 500, color: 'bg-teal-500' },
];

export const Shop: React.FC<Props> = ({ tokens, onPurchase, unlockedItems, onClose }) => {
    const handleBuy = (item: typeof ITEMS[0]) => {
        if (unlockedItems.includes(item.id)) {
            // Equip logic if we had it, for now just play click
            playSound('click');
        } else if (tokens >= item.cost) {
            playSound('win');
            onPurchase(item.cost, item.id);
        } else {
            playSound('wrong');
        }
    };

    return (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 z-20 flex flex-col p-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <span role="img" aria-label="shop">🏪</span> Sticker Shop
                </h2>
                <div className="bg-yellow-100 px-4 py-2 rounded-full flex items-center gap-2 border-2 border-yellow-400">
                    <CandyToken size={24}/>
                    <span className="font-black text-yellow-800 text-xl">{tokens}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto p-2">
                {ITEMS.map(item => {
                    const isUnlocked = unlockedItems.includes(item.id);
                    const canAfford = tokens >= item.cost;
                    
                    return (
                        <div key={item.id} className={`p-4 rounded-xl border-4 flex flex-col items-center gap-3 ${isUnlocked ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className={`w-16 h-16 rounded-full ${item.color} shadow-inner`}></div>
                            <div className="text-center">
                                <p className="font-bold text-gray-700">{item.name}</p>
                                {isUnlocked ? (
                                    <p className="text-green-600 font-bold text-sm flex items-center justify-center gap-1"><Check size={14}/> Owned</p>
                                ) : (
                                    <p className="text-gray-500 font-bold text-sm flex items-center justify-center gap-1">
                                        <CandyToken size={14}/> {item.cost}
                                    </p>
                                )}
                            </div>
                            <Button 
                                onClick={() => handleBuy(item)}
                                disabled={!isUnlocked && !canAfford}
                                className={`w-full py-2 text-sm ${isUnlocked ? 'bg-green-600' : (canAfford ? 'bg-blue-600' : 'bg-gray-400')}`}
                            >
                                {isUnlocked ? 'Owned' : 'Buy'}
                            </Button>
                        </div>
                    )
                })}
            </div>

            <div className="mt-4">
                <Button onClick={onClose} variant="secondary" className="w-full py-4 text-xl font-bold">
                    Back to Game
                </Button>
            </div>
        </div>
    );
};
