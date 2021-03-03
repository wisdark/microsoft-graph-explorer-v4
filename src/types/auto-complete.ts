import { IQuery } from './query-runner';

export interface IAutoCompleteProps {
  contentChanged: Function;
  runQuery: Function;
}

export interface IAutocompleteUtilProps {
  fetchingSuggestions?: boolean;
  sampleQuery: IQuery;
  autoCompleteError?: any;
  autoCompleteOptions: {
    url: string;
    parameters: any[];
  };
}

export interface IAutoCompleteState {
  activeSuggestion: number;
  filteredSuggestions: string[];
  suggestions: string[];
  showSuggestions: boolean;
  userInput: string;
  compare: string;
  queryUrl: string;
}

export interface ISuggestionsList {
  activeSuggestion: number;
  filteredSuggestions: string[];
  onClick: Function;
}