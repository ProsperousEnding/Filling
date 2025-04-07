// 导入所有store
import { useArticleStore } from './article'
import { useCategoryStore } from './category'
import { useTagStore } from './tag'
import { useCommentStore } from './comment'
import { useConfigStore } from './config'
import { useSearchStore } from './search'

// 导出store
export {
  useArticleStore,
  useCategoryStore,
  useTagStore,
  useCommentStore,
  useConfigStore,
  useSearchStore
} 