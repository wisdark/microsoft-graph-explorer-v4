import { getId, getTheme, Icon, ITextField, KeyCodes, Spinner, TextField, TooltipHost } from 'office-ui-fabric-react';
import { ITooltipHostStyles } from 'office-ui-fabric-react/lib/components/Tooltip/TooltipHost.types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { componentNames, eventTypes, telemetry } from '../../../../../telemetry';
import { IAutoCompleteProps, IAutocompleteUtilProps } from '../../../../../types/auto-complete';
import { SortOrder } from '../../../../../types/enums';
import { fetchAutoCompleteOptions } from '../../../../services/actions/autocomplete-action-creators';
import { dynamicSort } from '../../../../utils/dynamic-sort';
import { sanitizeQueryUrl } from '../../../../utils/query-url-sanitization';
import { parseSampleUrl } from '../../../../utils/sample-url-generation';
import { translateMessage } from '../../../../utils/translate-messages';
import { queryInputStyles } from '../QueryInput.styles';
import {
  cleanUpSelectedSuggestion, getLastCharacterOf,
  getLastSymbolInUrl,
  getParametersWithVerb
} from './auto-complete.util';
import SuggestionsList from './SuggestionsList';

const AutoComplete = (props: IAutoCompleteProps) => {
  const autoCompleteRef: React.RefObject<ITextField> = React.createRef();
  const dispatch = useDispatch();

  const { sampleQuery, autoComplete } = useSelector((state: any) => state);
  const fetchingSuggestions = autoComplete.pending;
  const autoCompleteError = autoComplete.error;

  const [activeSuggestion, setActiveSuggestion] = useState<number>(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>(sampleQuery.sampleUrl);
  const [queryUrl, setQueryUrl] = useState<string>(sampleQuery.sampleUrl);
  const [compare, setCompare] = useState<string>('');

  useEffect(() => {
    if (autoComplete.data) {
      performLocalSearch(userInput);
      setFilteredSuggestions(suggestions);
      setShowSuggestions(true);
    }
  }, [autoComplete]);

  useEffect(() => {
    const newUrl = sampleQuery.sampleUrl;
    setUserInput(newUrl);
    setQueryUrl(newUrl);
    if (autoComplete.data) {
      performLocalSearch(userInput);
      setFilteredSuggestions(suggestions);
      setShowSuggestions(true);
    }
  }, [sampleQuery]);



  const getRef = (): ITextField | null => {
    return autoCompleteRef.current;
  };

  const setFocus = () => {
    getRef()!.blur();
    // Gives the chance for the focus to take effect
    setTimeout(() => {
      getRef()!.focus();
    }, 10);
  }

  function updateUrlContent(e: any) {
    const value = e.target.value;
    props.contentChanged(value);
  };

  const onChange = (e: any) => {
    const previousUserInput = userInput;
    const value = e.target.value;
    setUserInput(value);
    setQueryUrl(value);

    if (showSuggestions && suggestions.length) {
      filterSuggestions(previousUserInput);
    }
    initialiseAutoComplete(value);
  };

  const filterSuggestions = (previousUserInput: string) => {
    let compareString = userInput.replace(previousUserInput, '');
    if (compare) {
      compareString = compare + compareString;
    }

    // Filter our suggestions that don't contain the user's input
    const filtered = suggestions.filter((suggestion: string) => {
      return suggestion.toLowerCase().indexOf(compareString.toLowerCase()) > -1;
    });

    setFilteredSuggestions(filtered);
    setCompare(compareString);

    return filtered;
  }

  const initialiseAutoComplete = (url: string) => {
    switch (getLastCharacterOf(url)) {
      case '/':
      case '?':
        requestForAutocompleteOptions(url);
        break;

      case '=':

        if (url.includes('?$')) {
          getParameterEnums(url);
        }

        break;

      case ',':
        getParameterEnums(url);
        break;

      case '&':
        getQueryParameters();
        break;

      default:
        break;
    }
  }

  const requestForAutocompleteOptions = (url: string) => {
    const signature = sanitizeQueryUrl(url);
    const { requestUrl, queryVersion } = parseSampleUrl(signature);
    if (queryVersion) {
      if (!requestUrl) {
        dispatch(fetchAutoCompleteOptions('', queryVersion));
      } else {
        if (!autoComplete.data || `${requestUrl}` !== autoComplete.data.url) {
          dispatch(fetchAutoCompleteOptions(requestUrl, queryVersion));
        } else {
          performLocalSearch(url);
        }
      }
    }
  }

  const performLocalSearch = (url: string) => {
    switch (getLastCharacterOf(url)) {
      case '/':
        displayLinkOptions();
        break;

      case '?':
        getQueryParameters();
        break;

      default:
        break;
    }
  }

  const getParameterEnums = (url: string) => {
    const utilProps: IAutocompleteUtilProps = { autoCompleteOptions: autoComplete.data, sampleQuery };
    const parametersWithVerb = getParametersWithVerb(utilProps);
    if (!parametersWithVerb) {
      return;
    }
    const param = url.split('$').pop()!.split('=')[0];
    const section = parametersWithVerb.values.find((k: { name: string; }) => {
      return k.name === `$${param}`;
    });

    if (section && section.items && section.items.length > 0) {
      setSuggestions(section.items);
    }
  }


  const getQueryParameters = () => {
    const utilProps: IAutocompleteUtilProps = { autoCompleteOptions: autoComplete.data, sampleQuery };

    const parametersWithVerb = getParametersWithVerb(utilProps);
    if (!parametersWithVerb) {
      return;
    }

    let filtered = parametersWithVerb.values.map((value: { name: any; }) => value.name);
    if (compare) {
      filtered = filtered.filter((suggestion: string) => {
        return suggestion.toLowerCase().indexOf(compare.toLowerCase()) > -1;
      });
    }

    setSuggestions(filtered);
  }

  const displayLinkOptions = () => {
    const utilProps: IAutocompleteUtilProps = { autoCompleteOptions: autoComplete.data, sampleQuery };
    const parametersWithVerb = getParametersWithVerb(utilProps);
    if (!parametersWithVerb) {
      return;
    }

    let filtered = parametersWithVerb.links;
    if (compare) {
      filtered = filtered.filter((suggestion: string) => {
        return suggestion.toLowerCase().indexOf(compare.toLowerCase()) > -1;
      });
    }

    setSuggestions(filtered);
  }

  const onKeyDown = (event: any) => {
    switch (event.keyCode) {
      case KeyCodes.enter:
        if (showSuggestions) {
          const selected = filteredSuggestions[activeSuggestion];
          appendSuggestionToUrl(selected);
        } else {
          props.contentChanged(queryUrl);
          props.runQuery();
        }
        break;

      case KeyCodes.tab:
        if (showSuggestions) {
          event.preventDefault();
          const selected = filteredSuggestions[activeSuggestion];
          appendSuggestionToUrl(selected);
        }
        break;

      case KeyCodes.up:
        event.preventDefault();
        if (showSuggestions) {
          let active = activeSuggestion - 1;
          if (activeSuggestion === 0) {
            active = filteredSuggestions.length - 1;
          }
          setActiveSuggestion(active);
        }
        break;

      case KeyCodes.down:
        event.preventDefault();
        if (showSuggestions) {
          let active = activeSuggestion + 1;
          if (activeSuggestion === filteredSuggestions.length - 1) {
            active = 0;
          }
          setActiveSuggestion(active);
        }
        break;

      case KeyCodes.escape:
        if (showSuggestions) {
          setShowSuggestions(false);
        }
        break;

      default:
        break;
    }

    const controlSpace = event.ctrlKey && event.keyCode === KeyCodes.space;
    const controlPeriod = event.ctrlKey && event.keyCode === KeyCodes.period;
    if (controlSpace || controlPeriod) {
      const value = event.target.value;
      const lastSymbol = getLastSymbolInUrl(value);
      const previousUserInput = userInput.substring(0, lastSymbol.value + 1);
      if (lastSymbol.key === '/' || lastSymbol.key === '?') {
        const compareString = value.replace(previousUserInput, '');
        setCompare(compareString);
        setUserInput(previousUserInput);
        requestForAutocompleteOptions(previousUserInput);
      } else {
        const filtered = filterSuggestions(previousUserInput);
        updateSuggestions(filtered, value.replace(previousUserInput, ''));
      }
    }
  };

  const updateSuggestions = (suggestionsList: string[], compareString?: string) => {
    const sortedSuggestions = suggestionsList.sort(dynamicSort(null, SortOrder.ASC));
    setFilteredSuggestions(sortedSuggestions);
    setSuggestions(sortedSuggestions);
    setShowSuggestions((suggestions.length > 0));
    setCompare(compareString || '')
  }

  const selectSuggestion = (e: any) => {
    const selected = e.currentTarget.innerText;
    appendSuggestionToUrl(selected);
  };

  const appendSuggestionToUrl = (selected: string) => {
    if (!selected) { return; }
    if (selected.startsWith('$')) {
      selected += '=';
    }
    const selectedSuggestion = cleanUpSelectedSuggestion(compare, userInput, selected);
    setActiveSuggestion(0);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    setUserInput(selectedSuggestion);
    setCompare('');
    setQueryUrl(selectedSuggestion);

    props.contentChanged(selectedSuggestion);
    setFocus();
    initialiseAutoComplete(selectedSuggestion);
    trackSuggestionSelectionEvent(selected);
  }


  const trackSuggestionSelectionEvent = (suggestion: string) => {
    telemetry.trackEvent(eventTypes.DROPDOWN_CHANGE_EVENT,
      {
        ComponentName: componentNames.QUERY_URL_AUTOCOMPLETE_DROPDOWN,
        SelectedSuggestion: suggestion
      });
  }

  const renderSuffix = () => {
    const calloutProps = { gapSpace: 0 };
    const hostStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };

    if (fetchingSuggestions) {
      return (<TooltipHost
        content={translateMessage('Fetching suggestions')}
        id={getId()}
        calloutProps={calloutProps}
        styles={hostStyles}
      >
        <Spinner />
      </TooltipHost>
      );
    }

    if (autoCompleteError) {
      return (
        <TooltipHost
          content={translateMessage('No auto-complete suggestions available')}
          id={getId()}
          calloutProps={calloutProps}
          styles={hostStyles}
        >
          <Icon iconName='MuteChat' />
        </TooltipHost>);
    }

    return null;
  }

  const closeSuggestionDialog = (event: any) => {
    const { currentTarget, relatedTarget } = event;
    if (!currentTarget.contains(relatedTarget as Node) && showSuggestions) {
      setShowSuggestions(false);
    }
  }

  const {
    input: autoInput,
  }: any = queryInputStyles(getTheme()).autoComplete;

  return (
    <div onBlur={closeSuggestionDialog}>
      <TextField
        className={autoInput}
        type='text'
        autoComplete='off'
        onChange={onChange}
        onBlur={updateUrlContent}
        onKeyDown={onKeyDown}
        value={queryUrl}
        componentRef={autoCompleteRef}
        onRenderSuffix={(renderSuffix()) ? renderSuffix : undefined}
        ariaLabel={translateMessage('Query Sample Input')}
        role='textbox'
      />
      {showSuggestions && userInput && filteredSuggestions.length > 0 &&
        <SuggestionsList
          filteredSuggestions={filteredSuggestions}
          activeSuggestion={activeSuggestion}
          onClick={(e: any) => selectSuggestion(e)} />}
    </div>
  )
}

export default AutoComplete;
