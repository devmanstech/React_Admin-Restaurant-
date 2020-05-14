import { handleActions } from 'redux-actions';

import {
  getCategories,
  getCategoriesFailed,
  getCategoriesSucceed,
  addCategory,
  addCategoryFailed,
  addCategorySucceed,
  deleteCategory,
  deleteCategoryFailed,
  deleteCategorySucceed,
  updateCategory,
  updateCategoryFailed,
  updateCategorySucceed,
  addCategories,
  addCategoriesSucceed,
  addCategoriesFailed,
  getCategory,
  getCategoryFailed,
  getCategorySucceed,
  updateCurrentCategory
} from './categoryActions';

const defaultState = {
  categories: null,
  error: null,
  loading: false,
  message: '',
  success: false,
  currentCategory: null
};

const reducer = handleActions({
  [getCategories](state) {
    return {
      ...state,
      error: null,
      loading: true,
      message: 'Generating category lists...'
    }
  },
  [getCategoriesFailed](state, { payload: { error } }) {
    return {
      ...state,
      error,
      loading: false
    }
  },
  [getCategoriesSucceed](state, { payload: { categories } }) {
    return {
      ...state,
      loading: false,
      categories
    }
  },
  [addCategory](state) {
    return {
      ...state,
      loading: true,
      success: false,
      message: 'Adding Category...',
      error: null
    }
  },
  [addCategorySucceed](state) {
    return {
      ...state,
      loading: false,
      success: true,
      message: 'Category added successfully',
      error: null
    }
  },
  [addCategoryFailed](state, { payload: { error } }) {
    return {
      ...state,
      loading: false,
      success: false,
      error
    }
  },
  [deleteCategory](state, { payload: { id } }) {
    return {
      ...state,
      loading: true,
      success: false,
      message: 'Deleting Category...',
      error: null
    }
  },
  [deleteCategorySucceed](state) {
    return {
      ...state,
      loading: false,
      success: true,
      message: 'Category deleted successfully'
    }
  },
  [deleteCategoryFailed](state, { payload: { error }}) {
    return {
      ...state,
      loading: false,
      success: false,
      error
    }
  },
  [updateCategory](state) {
    return {
      ...state,
      loading: true,
      success: false,
      message: 'Updating category...',
      error: null
    }
  },
  [updateCategorySucceed](state) {
    return {
      ...state,
      loading: false,
      success: true,
      message: 'Category updated successfully',
    }
  },
  [updateCategoryFailed](state, { payload: { error } }) {
    return {
      ...state,
      loading: false,
      success: false,
      error
    }
  },
  [addCategories](state) {
    return {
      ...state,
      loading: true,
      success: false,
      message: 'Adding Categories...'
    };
  },
  [addCategoriesSucceed](state) {
    return {
      ...state,
      loading: false,
      success: true,
      message: 'Categories updated successfully'
    };
  },
  [addCategoriesFailed](
    state,
    {
      payload: { error }
    }
  ) {
    return {
      ...state,
      loading: false,
      error,
      success: false
    };
  },
  [getCategory](state) {
    return {
      ...state,
      loading: true,
      success: false,
      message: 'Getting category info...',
      error: null
    }
  },
  [getCategorySucceed](state, { payload: { category } }) {
    return {
      ...state,
      loading: false,
      message: '',
      currentCategory: category
    }
  },
  [getCategoryFailed](state, { payload: { error } }) {
    return {
      ...state,
      loading: false,
      success: false,
      message: 'Getting category info failed',
      error,
      currentCategory: null
    }
  },
  [updateCurrentCategory]( state, { payload: { category } }) {
    return {
      ...state,
      currentCategory: category
    }
  }
}, defaultState);

export default reducer;