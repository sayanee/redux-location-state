import {isEqual, get, createObjectFromConfig, parseParams, createParamsString} from './helpers';
import {OBJECT_KEY_DELIMITER} from './constants';
import {typeHandles} from './typeHandles';

export function stateToParams(initialState, currentState, location) {
  const pathConfig = createObjectFromConfig(initialState, location);
  const query = parseParams(location.search);
  if (!pathConfig) {return {location: {...location}}}
  let shouldPush = false;
  //check the original config for values
  const newQueryParams = Object.keys(pathConfig).reduce((prev, curr) => {
    const {stateKey, options = {}, initialState: initialValue, type} = pathConfig[curr];
    let currentItemState = get(currentState, stateKey);
    let isDefault;
    //check if the date is the same as the one in initial value
    if (type === 'date') {
      isDefault = (currentItemState.toISOString().substring(0, 10)) === (initialValue && initialValue.toISOString().substring(0, 10));
    } else {
      //if an empty object, make currentItemState undefined
      if (currentItemState && typeof(currentItemState) === 'object' && !Object.keys(currentItemState).length) {
        currentItemState = undefined;
      }
      // check if the item is default
      isDefault = typeof(currentItemState) === 'object' ? isEqual(initialValue, currentItemState) : currentItemState === initialValue;
    }
    // if it is default or doesn't exist don't make a query parameter
    if (((!currentItemState && !options.serialize) || isDefault) && !options.setAsEmptyItem) {
      return prev;
    }
    // otherwise, check if there is a serialize function
    if (options.serialize) {
      const itemState = options.serialize(currentItemState);
      // short circuit if specialized serializer returns specifically undefined
      if (typeof itemState === 'undefined') {
        return prev;
      }
      currentItemState = itemState;
    } else if (type) {
     currentItemState = typeHandles[type].serialize(currentItemState, options);
    }
    // add new params to reduced object
    prev[encodeURIComponent(curr)] = encodeURIComponent(currentItemState);
    //check if a shouldPush property has changed
    if ((encodeURIComponent(currentItemState) !== query[encodeURIComponent(curr)]) && options.shouldPush) {
      shouldPush = true;
    }
    return prev;
  }, {});
  return {location: {...location, search: createParamsString(newQueryParams)}, shouldPush};
}