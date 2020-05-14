import { handleActions } from 'redux-actions';

import {
  getItems,
  getItemsSucceed,
  getItemsFailed,
  deleteItem,
  deleteItemSucceed,
  deleteItemFailed,
  deleteItem1,
  deleteItem1Succeed,
  deleteItem1Failed,
  updateItem,
  updateItemSucceed,
  updateItemFailed,
  addItem,
  addItemSucceed,
  addItemFailed,
  addItem1,
  addItem1Succeed,
  addItem1Failed,
  getItem,
  getItemSucceed,
  getItemFailed,
  updateCurrentItem,
  addItems,
  addItemsSucceed,
  addItemsFailed,
  addItems1,
  addItems1Succeed,
  addItems1Failed
} from './itemActions';

const defaultState = {
  items: null,
  error: null,
  loading: false,
  messages: '',
  success: false,
  currentItem: null
};

const reducer = handleActions(
  {
    [getItems](state) {
      return {
        ...state,
        error: null,
        loading: true,
        message: 'Generating items list...'
      };
    },
    [getItemsSucceed](
      state,
      {
        payload: { items }
      }
    ) {
      return {
        ...state,
        loading: false,
        items
      };
    },
    [getItemsFailed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        error,
        loading: false
      };
    },
    [addItem](state) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Adding item...',
        error: null
      };
    },
    [addItemSucceed](state) {
      return {
        ...state,
        loading: false,
        success: true,
        message: 'Item added successfully'
      };
    },
    [addItemFailed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        error
      };
    },
    [addItem1](state) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Adding item...',
        error: null
      };
    },
    [addItem1Succeed](state) {
      return {
        ...state,
        loading: false,
        success: true,
        message: 'Items updated successfully'
      };
    },
    [addItem1Failed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        error
      };
    },
    [addItems](state) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Adding items...',
        error: null
      };
    },
    [addItemsSucceed](state) {
      return {
        ...state,
        loading: false,
        success: true,
        message: 'Items added successfully'
      };
    },
    [addItemsFailed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        error
      };
    },
    [addItems1](state) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Updaing items...',
        error: null
      };
    },
    [addItems1Succeed](state) {
      return {
        ...state,
        loading: false,
        success: true,
        message: 'Items updated successfully'
      };
    },
    [addItems1Failed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        error
      };
    },
    [deleteItem](
      state,
      {
        payload: { id }
      }
    ) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Deleting item...',
        error: null
      };
    },
    [deleteItemSucceed](state) {
      return {
        ...state,
        loading: false,
        success: true,
        message: 'Item deleted successfully'
      };
    },
    [deleteItemFailed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        error
      };
    },
    [deleteItem1](
      state,
      {
        payload: { id }
      }
    ) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Deleting item...',
        error: null
      };
    },
    [deleteItem1Succeed](state) {
      return {
        ...state,
        loading: false,
        success: true,
        message: 'Item deleted successfully'
      };
    },
    [deleteItem1Failed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        error
      };
    },
    [updateItem](state) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Uploading item...',
        error: null
      };
    },
    [updateItemSucceed](state) {
      return {
        ...state,
        loading: false,
        success: true,
        message: 'Item updated successfully'
      };
    },
    [updateItemFailed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        error
      };
    },
    [getItem](state) {
      return {
        ...state,
        loading: true,
        success: false,
        message: 'Getting item info...',
        error: null
      };
    },
    [getItemSucceed](
      state,
      {
        payload: { item }
      }
    ) {
      return {
        ...state,
        loading: false,
        message: '',
        currentItem: item
      };
    },
    [getItemFailed](
      state,
      {
        payload: { error }
      }
    ) {
      return {
        ...state,
        loading: false,
        success: false,
        message: 'Getting item info failed',
        error,
        currentItem: null
      };
    },
    [updateCurrentItem](
      state,
      {
        payload: { item }
      }
    ) {
      return {
        ...state,
        currentItem: item
      };
    }
  },
  defaultState
);

export default reducer;
