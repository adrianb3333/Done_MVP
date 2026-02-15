import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotesState {
  point1: string;
  point2: string;
  point3: string;
}

export interface FocusData {
  id: number;
  name: string;
  content: string;
}

export interface SwingThoughtsData {
  driver: NotesState;
  woods: NotesState;
  irons: NotesState;
  wedges: NotesState;
  chipping: NotesState;
  bunker: NotesState;
  putter: NotesState;
}

export interface UserData {
  general: {
    focuses: FocusData[];
  };
  clubNotes: Record<string, NotesState>;
  golfIQ: Record<string, string>;
  mentalGame: {
    preShotRoutine: string;
  };
  preRound: {
    routine: string;
  };
  swingThoughts: SwingThoughtsData;
}

const DEFAULT_USER_DATA: UserData = {
  general: {
    focuses: [],
  },
  clubNotes: {},
  golfIQ: {},
  mentalGame: {
    preShotRoutine: '',
  },
  preRound: {
    routine: '',
  },
  swingThoughts: {
    driver: { point1: '', point2: '', point3: '' },
    woods: { point1: '', point2: '', point3: '' },
    irons: { point1: '', point2: '', point3: '' },
    wedges: { point1: '', point2: '', point3: '' },
    chipping: { point1: '', point2: '', point3: '' },
    bunker: { point1: '', point2: '', point3: '' },
    putter: { point1: '', point2: '', point3: '' },
  },
};

const STORAGE_KEY = '@user_data';

export function useUserData() {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveData = useCallback(async (data: UserData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setUserData(data);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }, []);

  const updateGeneral = useCallback(
    (focuses: FocusData[]) => {
      const newData = { ...userData, general: { focuses } };
      saveData(newData);
    },
    [userData, saveData]
  );

  const updateClubNotes = useCallback(
    (club: string, notes: NotesState) => {
      const newData = {
        ...userData,
        clubNotes: { ...userData.clubNotes, [club]: notes },
      };
      saveData(newData);
    },
    [userData, saveData]
  );

  const updateGolfIQ = useCallback(
    (key: string, value: string) => {
      const newData = {
        ...userData,
        golfIQ: { ...userData.golfIQ, [key]: value },
      };
      saveData(newData);
    },
    [userData, saveData]
  );

  const updateMentalGame = useCallback(
    (preShotRoutine: string) => {
      const newData = {
        ...userData,
        mentalGame: { preShotRoutine },
      };
      saveData(newData);
    },
    [userData, saveData]
  );

  const updatePreRound = useCallback(
    (routine: string) => {
      const newData = {
        ...userData,
        preRound: { routine },
      };
      saveData(newData);
    },
    [userData, saveData]
  );

  const updateSwingThoughts = useCallback(
    (swingThoughts: SwingThoughtsData) => {
      const newData = { ...userData, swingThoughts };
      saveData(newData);
    },
    [userData, saveData]
  );

  if (!isLoaded) {
    loadData();
  }

  return {
    userData,
    updateGeneral,
    updateClubNotes,
    updateGolfIQ,
    updateMentalGame,
    updatePreRound,
    updateSwingThoughts,
  };
}
