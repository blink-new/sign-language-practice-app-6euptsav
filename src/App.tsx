import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  
  Trash2, 
  Shuffle, 
  List as ListIcon,
  Clock,
  BookOpen,
  Target
} from 'lucide-react';

interface WordList {
  id: string;
  name: string;
  words: string[];
  color: string;
  createdAt: Date;
}

interface PracticeSession {
  listId: string;
  currentWordIndex: number;
  isPlaying: boolean;
  isRandom: boolean;
  duration: number;
  timeLeft: number;
  completedWords: number;
  totalWords: number;
}

const COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-red-500'
];

function App() {
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListWords, setNewListWords] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedLists = localStorage.getItem('signLanguageLists');
    if (savedLists) {
      const parsed = JSON.parse(savedLists);
      setWordLists(parsed.map((list: WordList & { createdAt: string }) => ({
        ...list,
        createdAt: new Date(list.createdAt)
      })));
    }
  }, []);

  // Save to localStorage whenever wordLists change
  useEffect(() => {
    localStorage.setItem('signLanguageLists', JSON.stringify(wordLists));
  }, [wordLists]);

  // Practice session timer
  useEffect(() => {
    if (!practiceSession || !practiceSession.isPlaying) return;

    const timer = setInterval(() => {
      setPracticeSession(prev => {
        if (!prev) return null;
        
        if (prev.timeLeft <= 1) {
          // Move to next word
          const currentList = wordLists.find(l => l.id === prev.listId);
          if (!currentList) return null;

          const nextIndex = prev.isRandom 
            ? Math.floor(Math.random() * currentList.words.length)
            : (prev.currentWordIndex + 1) % currentList.words.length;

          return {
            ...prev,
            currentWordIndex: nextIndex,
            timeLeft: prev.duration,
            completedWords: prev.completedWords + 1
          };
        }

        return {
          ...prev,
          timeLeft: prev.timeLeft - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [practiceSession, wordLists]);

  const createWordList = () => {
    if (!newListName.trim() || !newListWords.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const words = newListWords
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    if (words.length === 0) {
      toast.error('Veuillez ajouter au moins un mot');
      return;
    }

    const newList: WordList = {
      id: Date.now().toString(),
      name: newListName,
      words,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: new Date()
    };

    setWordLists(prev => [...prev, newList]);
    setIsCreating(false);
    setNewListName('');
    setNewListWords('');
    toast.success(`Liste "${newListName}" créée avec ${words.length} mots`);
  };

  const deleteWordList = (id: string) => {
    const list = wordLists.find(l => l.id === id);
    setWordLists(prev => prev.filter(l => l.id !== id));
    toast.success(`Liste "${list?.name}" supprimée`);
  };

  const startPractice = (listId: string, isRandom: boolean = false, duration: number = 10) => {
    const list = wordLists.find(l => l.id === listId);
    if (!list) return;

    const startIndex = isRandom ? Math.floor(Math.random() * list.words.length) : 0;

    setPracticeSession({
      listId,
      currentWordIndex: startIndex,
      isPlaying: true,
      isRandom,
      duration,
      timeLeft: duration,
      completedWords: 0,
      totalWords: list.words.length
    });
  };

  const stopPractice = () => {
    setPracticeSession(null);
  };

  const togglePractice = () => {
    if (!practiceSession) return;
    setPracticeSession(prev => prev ? { ...prev, isPlaying: !prev.isPlaying } : null);
  };

  const getCurrentWord = () => {
    if (!practiceSession) return '';
    const list = wordLists.find(l => l.id === practiceSession.listId);
    return list?.words[practiceSession.currentWordIndex] || '';
  };

  const getCurrentList = () => {
    if (!practiceSession) return null;
    return wordLists.find(l => l.id === practiceSession.listId);
  };

  // Practice Mode View
  if (practiceSession) {
    const currentWord = getCurrentWord();
    const currentList = getCurrentList();
    const progress = ((practiceSession.duration - practiceSession.timeLeft) / practiceSession.duration) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-700 mb-2">
              Entraînement : {currentList?.name}
            </h1>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Mots : {practiceSession.completedWords} terminés
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {practiceSession.timeLeft}s restants
              </div>
              <div className="flex items-center gap-2">
                {practiceSession.isRandom ? <Shuffle className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                {practiceSession.isRandom ? 'Aléatoire' : 'Séquentiel'}
              </div>
            </div>
          </div>

          {/* Main Word Display */}
          <Card className="mb-8 border-2 shadow-lg">
            <CardContent className="py-20">
              <div className="text-8xl font-bold text-indigo-600 mb-4 tracking-wide">
                {currentWord.toUpperCase()}
              </div>
              <Progress value={progress} className="w-64 mx-auto h-2" />
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={togglePractice}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              {practiceSession.isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Reprendre
                </>
              )}
            </Button>
            <Button
              onClick={stopPractice}
              variant="destructive"
              size="lg"
              className="flex items-center gap-2"
            >
              <Square className="w-5 h-5" />
              Arrêter la pratique
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pratique de la Langue des Signes</h1>
              <p className="text-gray-600 mt-1">Entraînez-vous à la langue des signes avec des listes de mots personnalisées</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {wordLists.length} listes
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Create New List Button */}
        <div className="mb-8">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" size="lg">
                <Plus className="w-5 h-5" />
                Créer une nouvelle liste de mots
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle liste de mots</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listName">Nom de la liste</Label>
                  <Input
                    id="listName"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="ex. Animaux, Couleurs, Objets du quotidien"
                  />
                </div>
                <div>
                  <Label htmlFor="words">Mots (un par ligne)</Label>
                  <Textarea
                    id="words"
                    value={newListWords}
                    onChange={(e) => setNewListWords(e.target.value)}
                    placeholder="chat&#10;chien&#10;oiseau&#10;poisson"
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Annuler
                  </Button>
                  <Button onClick={createWordList}>
                    Créer la liste
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Word Lists Grid */}
        {wordLists.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune liste de mots pour le moment</h3>
              <p className="text-gray-500 mb-4">Créez votre première liste de mots pour commencer à pratiquer la langue des signes</p>
              <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Créer votre première liste
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wordLists.map((list) => (
              <WordListCard
                key={list.id}
                list={list}
                onDelete={deleteWordList}
                onStartPractice={startPractice}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface WordListCardProps {
  list: WordList;
  onDelete: (id: string) => void;
  onStartPractice: (listId: string, isRandom: boolean, duration: number) => void;
}

function WordListCard({ list, onDelete, onStartPractice }: WordListCardProps) {
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [isRandom, setIsRandom] = useState(false);
  const [duration, setDuration] = useState([10]);

  const handleStartPractice = () => {
    onStartPractice(list.id, isRandom, duration[0]);
    setShowPracticeDialog(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${list.color}`} />
              {list.name}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {list.words.length} mots • Créé le {list.createdAt.toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(list.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Aperçu des mots :</div>
          <div className="flex flex-wrap gap-1">
            {list.words.slice(0, 6).map((word, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {word}
              </Badge>
            ))}
            {list.words.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{list.words.length - 6} de plus
              </Badge>
            )}
          </div>
        </div>

        <Dialog open={showPracticeDialog} onOpenChange={setShowPracticeDialog}>
          <DialogTrigger asChild>
            <Button className="w-full flex items-center gap-2">
              <Play className="w-4 h-4" />
              Commencer la pratique
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Paramètres de la pratique</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Ordre aléatoire</Label>
                  <p className="text-xs text-gray-500">Afficher les mots dans un ordre aléatoire</p>
                </div>
                <Switch
                  checked={isRandom}
                  onCheckedChange={setIsRandom}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Durée d'affichage : {duration[0]} secondes
                </Label>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  max={30}
                  min={3}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3s</span>
                  <span>30s</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPracticeDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleStartPractice} className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Commencer la pratique
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default App;