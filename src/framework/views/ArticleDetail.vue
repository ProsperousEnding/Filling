<template>
    <div class="article-detail-view" :class="articleViewClass">
        <img
            v-if="isArticleCoverHeaderBackground || isArticleCoverPageBackground"
            :src="articleCover"
            alt=""
            class="article-detail-cover-probe"
            aria-hidden="true"
            @error="articleCoverLoadFailed = true"
        />
        <div
            v-if="isArticleCoverPageBackground"
            class="article-detail-page-background"
            :style="articlePageBackgroundStyle"
            aria-hidden="true"
        ></div>

        <!-- 加载中 -->
        <div v-if="loading" class="py-12 flex justify-center">
            <div class="theme-loading-inline inline-flex items-center">
                <svg
                    class="animate-spin -ml-1 mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                    ></circle>
                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                正在加载文章...
            </div>
        </div>

        <!-- 文章找不到 -->
        <div
            v-else-if="hasResolved && !article"
            class="theme-empty-state py-12 text-center"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="theme-empty-icon h-16 w-16 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <h2 class="theme-empty-title text-xl font-bold mb-2">文章未找到</h2>
            <p class="theme-empty-text mb-6">
                该文章可能已被删除或您访问的链接有误
            </p>
            <router-link :to="homeRoute" class="btn-primary"
                >返回首页</router-link
            >
        </div>

        <!-- 文章内容 -->
        <article v-else-if="article" class="article-detail-shell">
            <!-- 文章头部 -->
            <header
                class="article-detail-header mb-8"
                :class="articleHeaderClass"
                :style="articleHeaderStyle"
            >
                <div
                    v-if="isArticleCoverHeaderBackground"
                    class="article-detail-header-background-overlay"
                ></div>
                <div
                    :class="
                        isArticleCoverHeaderBackground
                            ? 'article-detail-header-content'
                            : ''
                    "
                >
                    <!-- 分类 -->
                    <div class="mb-4" v-if="article.category">
                        <component
                            :is="categoryPageEnabled ? 'router-link' : 'span'"
                            :to="
                                categoryPageEnabled
                                    ? getCategoryRoute(article.category)
                                    : undefined
                            "
                            class="article-detail-category"
                        >
                            {{
                                typeof article.category === "string"
                                    ? article.category
                                    : article.category.name
                            }}
                        </component>
                    </div>

                    <!-- 标题 -->
                    <h1 class="article-detail-title text-3xl font-bold mb-4">
                        {{ article.title }}
                    </h1>

                    <!-- 文章元信息 -->
                    <div
                        class="article-detail-meta flex flex-wrap items-center text-sm"
                    >
                        <div
                            class="article-detail-meta-item flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span>{{ formatDate(article.createdAt) }}</span>
                        </div>
                        <div
                            v-if="displayUpdatedAt"
                            class="article-detail-meta-item flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.8"
                                    d="M4 4v5h.582m14.836 2A8.001 8.001 0 005.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.837-2m13.837 2H15"
                                />
                            </svg>
                            <span
                                >更新于 {{ formatDate(displayUpdatedAt) }}</span
                            >
                        </div>
                        <div
                            v-if="config.showReadTime && article.readTime"
                            class="article-detail-meta-item flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.8"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>约 {{ article.readTime }} 分钟阅读</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- 封面图 -->
            <div
                v-if="showArticleCoverImage"
                class="article-detail-cover relative mb-8"
                :class="
                    articleCoverAspectRatio
                        ? 'overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/70'
                        : ''
                "
                :style="articleCoverShellStyle"
            >
                <img
                    :src="articleCover"
                    :alt="article.title"
                    :loading="articleCoverLoading"
                    class="article-detail-cover-image w-full rounded-lg"
                    :class="
                        articleCoverAspectRatio
                            ? 'h-full rounded-none'
                            : 'h-auto'
                    "
                    :style="articleCoverImageStyle"
                    @error="articleCoverLoadFailed = true"
                />
                <span
                    v-if="coverWatermarkText"
                    class="article-detail-cover-watermark"
                    :class="coverWatermarkClass"
                    :style="coverWatermarkStyle"
                >
                    {{ coverWatermarkText }}
                </span>
            </div>
            <div
                v-else-if="showArticleCoverPlaceholder"
                class="article-detail-cover-placeholder mb-8"
                :data-placeholder="coverDetailConfig.placeholder"
                :style="articleCoverShellStyle"
            >
                <svg
                    v-if="coverDetailConfig.placeholder === 'icon'"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>

            <section
                v-if="outdatedNotice"
                class="article-detail-outdated mb-8 rounded-2xl border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm text-amber-900"
            >
                <p
                    class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80"
                >
                    内容提醒
                </p>
                <p class="leading-7">
                    这篇文章最后{{
                        outdatedNotice.referenceKind === "updated"
                            ? "更新"
                            : "发布"
                    }}于
                    {{ formatDate(outdatedNotice.referenceAt) }}，距今已超过
                    {{ outdatedNotice.thresholdDays }} 天，
                    部分内容可能已经过时，请结合当前版本或官方文档核实。
                </p>
            </section>

            <!-- 文章内容 -->
            <div
                class="article-detail-content article-content prose prose-lg dark:prose-invert max-w-none mb-8"
                v-html="article.content"
            ></div>

            <!-- 文章标签 -->
            <div
                class="article-detail-tags-wrap mb-8"
                v-if="article.tags && article.tags.length > 0"
            >
                <div class="article-detail-tags flex flex-wrap">
                    <component
                        v-for="tag in article.tags"
                        :key="typeof tag === 'string' ? tag : tag.id"
                        :is="tagPageEnabled ? 'router-link' : 'span'"
                        :to="tagPageEnabled ? getTagRoute(tag) : undefined"
                        class="tag"
                    >
                        {{ typeof tag === "string" ? tag : tag.name }}
                    </component>
                </div>
            </div>

            <section
                v-if="articleLicense"
                class="article-detail-license mb-10 rounded-2xl border border-slate-200 bg-slate-50/90 px-5 py-4 text-sm text-slate-600"
            >
                <p
                    class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                    许可协议
                </p>
                <component
                    :is="articleLicense.url ? 'a' : 'span'"
                    :href="articleLicense.url || undefined"
                    :target="articleLicense.external ? '_blank' : undefined"
                    :rel="articleLicense.external ? 'noreferrer' : undefined"
                    class="font-medium text-slate-700"
                >
                    {{ articleLicense.name }}
                </component>
            </section>

            <!-- 相关文章 -->
            <section
                class="article-detail-related mb-12"
                v-if="relatedArticles.length > 0"
            >
                <div class="article-detail-related-head">
                    <p class="article-detail-related-kicker">Related</p>
                    <h2 class="article-detail-related-heading">相关文章</h2>
                </div>
                <div class="article-detail-related-grid">
                    <div
                        v-for="related in relatedArticles"
                        :key="related.id"
                        class="article-detail-related-card"
                    >
                        <router-link
                            :to="articleRoute(related)"
                            class="article-detail-related-link"
                        >
                            <img
                                v-if="
                                    showRelatedCover &&
                                    hasRelatedArticleCover(related)
                                "
                                :src="getRelatedArticleCover(related)"
                                :alt="related.title"
                                :loading="relatedCoverLoading"
                                class="article-detail-related-image"
                                :style="relatedCoverImageStyle"
                                @error="markRelatedCoverFailed(related)"
                            />
                            <div
                                v-else-if="showRelatedCoverPlaceholder"
                                class="article-detail-related-placeholder"
                                :data-placeholder="
                                    coverDetailConfig.placeholder
                                "
                            >
                                <svg
                                    v-if="
                                        coverDetailConfig.placeholder === 'icon'
                                    "
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-8 w-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="1.5"
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div class="article-detail-related-body">
                                <div class="article-detail-related-meta">
                                    <span
                                        v-if="getRelatedCategoryLabel(related)"
                                        class="article-detail-related-chip"
                                    >
                                        {{ getRelatedCategoryLabel(related) }}
                                    </span>
                                    <span
                                        v-if="related.readTime"
                                        class="article-detail-related-muted"
                                    >
                                        约 {{ related.readTime }} 分钟阅读
                                    </span>
                                </div>
                                <h3 class="article-detail-related-title">
                                    {{ related.title }}
                                </h3>
                                <p class="article-detail-related-date">
                                    {{ formatDate(related.createdAt) }}
                                </p>
                                <div
                                    v-if="getRelatedTags(related).length > 0"
                                    class="article-detail-related-tags"
                                >
                                    <span
                                        v-for="tag in getRelatedTags(related)"
                                        :key="getRelatedTagKey(tag)"
                                        class="article-detail-related-tag"
                                    >
                                        #{{ getRelatedTagLabel(tag) }}
                                    </span>
                                    <span
                                        v-if="
                                            getRelatedRemainingTagCount(
                                                related,
                                            ) > 0
                                        "
                                        class="article-detail-related-tag"
                                    >
                                        +{{
                                            getRelatedRemainingTagCount(related)
                                        }}
                                    </span>
                                </div>
                            </div>
                        </router-link>
                    </div>
                </div>
            </section>

            <SponsorSection />
            <CommentSection :article="article" />
        </article>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import CommentSection from "../components/core/CommentSection.vue";
import SponsorSection from "../components/core/SponsorSection.vue";
import { useArticleStore } from "../stores/article";
import { useConfigStore } from "../stores/config";
import {
    resolveOutdatedNotice,
    shouldShowUpdatedAt,
} from "../utils/articleMeta";
import { resolveDisplayArticleCover } from "../utils/articleCover";
import {
    getArticleRoute,
    getCategoryRoute,
    getHomeRoute,
    getTagRoute,
} from "../utils/routeLinks";
import { usePageMetadata } from "../composables/usePageMetadata";

// 获取路由参数
const route = useRoute();
const articleId = computed(() => route.params.id);
const homeRoute = getHomeRoute();

// 获取store
const articleStore = useArticleStore();
const configStore = useConfigStore();
const config = configStore;
const articleRoute = (target) => getArticleRoute(target);
const categoryPageEnabled = computed(() =>
    Boolean(config.pageRegistry?.categories),
);
const tagPageEnabled = computed(() => Boolean(config.pageRegistry?.tags));

// 状态
const article = ref(null);
const relatedArticles = ref([]);
const articleCoverLoadFailed = ref(false);
const relatedCoverFailures = ref(new Set());
const loading = ref(false);
const hasResolved = ref(false);
let activeRequestId = 0;
const displayUpdatedAt = computed(() => {
    const updatedAt = article.value?.updatedAt;

    if (!updatedAt) {
        return "";
    }

    if (
        !shouldShowUpdatedAt(
            updatedAt,
            article.value?.createdAt || article.value?.date,
        )
    ) {
        return "";
    }

    return updatedAt;
});
const outdatedNotice = computed(() =>
    resolveOutdatedNotice(article.value, {
        showOutdatedNotice: config.showOutdatedNotice,
        outdatedThresholdDays: config.outdatedThresholdDays,
    }),
);
const coverDetailConfig = computed(() => {
    const detail = configStore.coverConfig?.detail;

    if (!detail || typeof detail !== "object") {
        return {
            showCover: true,
            showRelatedCover: true,
            displayMode: "image",
            loading: "eager",
            aspectRatio: "",
            objectFit: "cover",
            placeholder: "gradient",
            pageBackground: {
                contentStyle: "transparent",
            },
            watermark: {
                enabled: false,
                text: "",
                position: "bottom-right",
                opacity: 0.72,
            },
        };
    }

    return {
        showCover: detail.showCover !== false,
        showRelatedCover: detail.showRelatedCover !== false,
        displayMode: ["image", "header-background", "page-background"].includes(
            String(detail.displayMode || "").trim(),
        )
            ? String(detail.displayMode || "").trim()
            : "image",
        loading: detail.loading === "lazy" ? "lazy" : "eager",
        aspectRatio: String(detail.aspectRatio || "").trim(),
        objectFit: String(detail.objectFit || "cover").trim() || "cover",
        placeholder: ["none", "gradient", "icon"].includes(
            String(detail.placeholder || "").trim(),
        )
            ? String(detail.placeholder || "").trim()
            : "gradient",
        pageBackground: {
            contentStyle: ["transparent", "glass"].includes(
                String(detail.pageBackground?.contentStyle || "").trim(),
            )
                ? String(detail.pageBackground?.contentStyle || "").trim()
                : "transparent",
        },
        watermark: normalizeCoverWatermark(detail.watermark),
    };
});
const articleCoverAspectRatio = computed(
    () => coverDetailConfig.value.aspectRatio,
);
const articleCover = computed(() =>
    resolveDisplayArticleCover(article.value, {
        coverConfig: configStore.coverConfig,
        style: configStore.coverStyle,
    }),
);

watch(articleCover, () => {
    articleCoverLoadFailed.value = false;
});

watch(relatedArticles, () => {
    relatedCoverFailures.value = new Set();
});

const showArticleCover = computed(
    () =>
        Boolean(articleCover.value) &&
        !articleCoverLoadFailed.value &&
        coverDetailConfig.value.showCover,
);
const articleCoverDisplayMode = computed(() => {
    const articleMode = String(article.value?.coverDisplayMode || "").trim();

    return ["image", "header-background", "page-background"].includes(
        articleMode,
    )
        ? articleMode
        : coverDetailConfig.value.displayMode;
});
const isArticleCoverHeaderBackground = computed(
    () =>
        showArticleCover.value &&
        articleCoverDisplayMode.value === "header-background",
);
const isArticleCoverPageBackground = computed(
    () =>
        showArticleCover.value &&
        articleCoverDisplayMode.value === "page-background",
);
const showArticleCoverImage = computed(
    () =>
        showArticleCover.value &&
        !isArticleCoverHeaderBackground.value &&
        !isArticleCoverPageBackground.value,
);
const showArticleCoverPlaceholder = computed(
    () =>
        coverDetailConfig.value.showCover &&
        (!articleCover.value || articleCoverLoadFailed.value) &&
        coverDetailConfig.value.placeholder !== "none",
);
const showRelatedCover = computed(
    () => coverDetailConfig.value.showRelatedCover,
);
const showRelatedCoverPlaceholder = computed(
    () =>
        showRelatedCover.value &&
        coverDetailConfig.value.placeholder !== "none",
);
const articleCoverLoading = computed(() => coverDetailConfig.value.loading);
const relatedCoverLoading = computed(() =>
    coverDetailConfig.value.loading === "eager"
        ? "lazy"
        : coverDetailConfig.value.loading,
);
const articleCoverShellStyle = computed(() =>
    articleCoverAspectRatio.value
        ? { aspectRatio: articleCoverAspectRatio.value }
        : {},
);
const articleCoverImageStyle = computed(() => ({
    objectFit: coverDetailConfig.value.objectFit,
}));
const articleHeaderClass = computed(() => ({
    "article-detail-header-with-background":
        isArticleCoverHeaderBackground.value,
}));
const articleHeaderStyle = computed(() =>
    isArticleCoverHeaderBackground.value
        ? {
              backgroundImage: `url("${String(articleCover.value).replace(/"/g, '\\"')}")`,
          }
        : {},
);
const articleViewClass = computed(() => ({
    "article-detail-view-with-page-background":
        isArticleCoverPageBackground.value,
    "article-detail-view-page-background-transparent":
        isArticleCoverPageBackground.value &&
        coverDetailConfig.value.pageBackground.contentStyle === "transparent",
    "article-detail-view-page-background-glass":
        isArticleCoverPageBackground.value &&
        coverDetailConfig.value.pageBackground.contentStyle === "glass",
}));
const articlePageBackgroundStyle = computed(() =>
    isArticleCoverPageBackground.value
        ? {
              backgroundImage: `url("${String(articleCover.value).replace(/"/g, '\\"')}")`,
          }
        : {},
);
const relatedCoverImageStyle = computed(() => ({
    objectFit: coverDetailConfig.value.objectFit,
}));
const getRelatedArticleCover = (target) =>
    resolveDisplayArticleCover(target, {
        coverConfig: configStore.coverConfig,
        style: configStore.coverStyle,
    });
const getRelatedCoverKey = (target) =>
    String(target?.id || getRelatedArticleCover(target));
const hasRelatedArticleCover = (target) =>
    Boolean(getRelatedArticleCover(target)) &&
    !relatedCoverFailures.value.has(getRelatedCoverKey(target));
const markRelatedCoverFailed = (target) => {
    relatedCoverFailures.value = new Set([
        ...relatedCoverFailures.value,
        getRelatedCoverKey(target),
    ]);
};
const getRelatedCategoryLabel = (target) =>
    typeof target?.category === "string"
        ? target.category
        : target?.category?.name || target?.category?.label || "";
const getRelatedTags = (target, limit = 2) =>
    Array.isArray(target?.tags) ? target.tags.slice(0, limit) : [];
const getRelatedRemainingTagCount = (target, limit = 2) =>
    Math.max(0, (Array.isArray(target?.tags) ? target.tags.length : 0) - limit);
const getRelatedTagLabel = (tag) =>
    typeof tag === "string" ? tag : tag?.name || tag?.label || "";
const getRelatedTagKey = (tag) =>
    typeof tag === "string" ? tag : tag?.id || tag?.name || tag?.label || "";
const coverWatermarkText = computed(() => {
    const watermark = coverDetailConfig.value.watermark || {};
    const text = String(watermark.text || "").trim();

    return watermark.enabled && text ? text : "";
});
const coverWatermarkClass = computed(
    () =>
        `article-detail-cover-watermark-${coverDetailConfig.value.watermark?.position || "bottom-right"}`,
);
const coverWatermarkStyle = computed(() => ({
    opacity: coverDetailConfig.value.watermark?.opacity ?? 0.72,
}));
const articleLicense = computed(() => {
    const license = article.value?.licenseDisabled
        ? null
        : article.value?.license || configStore.defaultLicense;

    if (!license || typeof license !== "object") {
        return null;
    }

    const name = String(license.name || "").trim();
    const url = String(license.url || "").trim();

    if (!name && !url) {
        return null;
    }

    return {
        name: name || url,
        url,
        external: /^(https?:\/\/|mailto:|tel:)/i.test(url),
    };
});

usePageMetadata({
    title: () => {
        if (article.value?.title) return article.value.title;
        if (hasResolved.value && !article.value) return "文章未找到";
        return "文章详情";
    },
    type: "article",
    image: () => articleCover.value || "",
    keywords: () => [
        article.value?.category?.name || "",
        ...(Array.isArray(article.value?.tags) ? article.value.tags : []).map(
            (tag) => tag?.name || "",
        ),
    ],
    description: () =>
        article.value?.description ||
        article.value?.summary ||
        article.value?.excerpt ||
        (hasResolved.value && !article.value
            ? "该文章可能已被删除或链接无效。"
            : "查看文章详情内容。"),
});

// 监听路由参数变化，支持同组件内跳转
watch(
    articleId,
    async (newId, oldId) => {
        if (!newId) {
            activeRequestId += 1;
            article.value = null;
            relatedArticles.value = [];
            loading.value = false;
            hasResolved.value = true;
            return;
        }

        await fetchArticleDetail(String(newId));

        if (oldId && newId !== oldId && typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    },
    { immediate: true },
);

// 获取文章详情
async function fetchArticleDetail(id) {
    const requestId = ++activeRequestId;
    const shouldShowLoading = hasResolved.value;
    article.value = null;
    relatedArticles.value = [];
    loading.value = shouldShowLoading;

    try {
        const [articleData, relatedData] = await Promise.all([
            articleStore.fetchArticleDetail(id),
            articleStore.fetchRelatedArticles(id, 3),
        ]);

        if (requestId !== activeRequestId) {
            return;
        }

        article.value = articleData || null;
        relatedArticles.value = Array.isArray(relatedData) ? relatedData : [];
    } catch (error) {
        if (requestId !== activeRequestId) {
            return;
        }

        console.error("获取文章详情失败:", error);
        article.value = null;
        relatedArticles.value = [];
    } finally {
        if (requestId === activeRequestId) {
            loading.value = false;
            hasResolved.value = true;
        }
    }
}

// 格式化日期（容错处理）
const formatDate = (dateString) => {
    if (!dateString) return "未知日期";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "未知日期";
    return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

function normalizeCoverWatermark(watermark = {}) {
    if (!watermark || typeof watermark !== "object") {
        return {
            enabled: false,
            text: "",
            position: "bottom-right",
            opacity: 0.72,
        };
    }

    const position = [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
    ].includes(watermark.position)
        ? watermark.position
        : "bottom-right";
    const opacity = Number.parseFloat(watermark.opacity);

    return {
        enabled: watermark.enabled === true,
        text: String(watermark.text || "").trim(),
        position,
        opacity: Number.isFinite(opacity)
            ? Math.min(Math.max(opacity, 0), 1)
            : 0.72,
    };
}
</script>

<style scoped>
.article-detail-view,
.article-detail-shell,
.article-detail-header,
.article-detail-cover,
.article-detail-content,
.article-detail-tags-wrap,
.article-detail-outdated,
.article-detail-license {
    min-width: 0;
}

.article-detail-title {
    line-height: 1.18;
    letter-spacing: 0;
    overflow-wrap: anywhere;
}

.article-detail-category {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
}

.article-detail-meta {
    gap: 0.55rem 1.35rem;
}

.article-detail-meta-item {
    min-width: 0;
    max-width: 100%;
}

.article-detail-meta-item svg {
    flex: 0 0 auto;
}

.article-detail-content :deep(iframe),
.article-detail-content :deep(embed),
.article-detail-content :deep(object) {
    width: 100%;
    max-width: 100%;
}

.article-detail-cover-probe {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
}

.article-detail-view-with-page-background {
    position: relative;
    isolation: isolate;
    margin: -1rem;
    padding: clamp(1rem, 2.4vw, 2rem);
    border-radius: 1.5rem;
    overflow: visible;
    --article-page-background-heading-color: #fff;
    --article-page-background-body-color: rgba(255, 255, 255, 0.92);
    --article-page-background-link-color: rgba(191, 219, 254, 0.98);
    --article-page-background-link-hover-color: #fff;
    --article-page-background-code-color: rgba(219, 234, 254, 0.98);
    --article-page-background-quote-color: rgba(219, 234, 254, 0.86);
    --article-page-background-quote-bg: rgba(255, 255, 255, 0.1);
    --article-page-background-quote-border: rgba(147, 197, 253, 0.62);
    --article-page-background-text-blend-mode: normal;
    --article-page-background-text-shadow: 0 2px 12px rgba(0, 0, 0, 0.46);
    --article-page-background-heading-shadow: 0 3px 20px rgba(0, 0, 0, 0.56);
}

.article-detail-page-background {
    position: fixed;
    inset: 0;
    z-index: 0;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    pointer-events: none;
}

.article-detail-page-background::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
        linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.5) 0%,
            rgba(15, 23, 42, 0.36) 18rem,
            rgba(15, 23, 42, 0.3) 34rem,
            rgba(15, 23, 42, 0.34) 100%
        ),
        radial-gradient(
            circle at 18% 8%,
            rgba(255, 255, 255, 0.08),
            transparent 30%
        );
}

.article-detail-view-with-page-background .article-detail-shell {
    position: relative;
    z-index: 1;
}

.article-detail-view-with-page-background .article-detail-header {
    padding-top: clamp(2rem, 8vw, 6rem);
}

.article-detail-view-with-page-background :deep(.article-detail-category) {
    border-color: rgba(255, 255, 255, 0.44);
    background: rgba(255, 255, 255, 0.22);
    color: #fff !important;
    box-shadow: none;
    backdrop-filter: blur(12px);
}

.article-detail-view-with-page-background .article-detail-title {
    color: #fff !important;
    text-shadow: 0 3px 24px rgba(0, 0, 0, 0.5);
}

.article-detail-view-with-page-background .article-detail-meta,
.article-detail-view-with-page-background .article-detail-meta-item {
    color: rgba(255, 255, 255, 0.92) !important;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.42);
}

.article-detail-view-with-page-background .article-detail-meta-item svg,
.article-detail-view-with-page-background .article-detail-meta-item span {
    color: inherit !important;
}

.article-detail-view-with-page-background .article-detail-content {
    padding: clamp(1.25rem, 3vw, 2.25rem);
    border: 1px solid transparent;
    border-radius: 1.5rem;
    background: transparent;
    box-shadow: none;
    color: var(
        --article-page-background-body-color,
        rgba(255, 255, 255, 0.92)
    ) !important;
    text-shadow: var(
        --article-page-background-text-shadow,
        0 2px 18px rgba(0, 0, 0, 0.34)
    );
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
}

.article-detail-view-page-background-transparent .article-detail-content {
    border-color: rgba(255, 255, 255, 0.1);
    background: transparent;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 10px 42px rgba(2, 6, 23, 0.04);
}

.article-detail-view-page-background-glass .article-detail-content {
    border-color: rgba(255, 255, 255, 0.18);
    background:
        linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.14),
            rgba(255, 255, 255, 0.04)
        ),
        rgba(255, 255, 255, 0.02);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.22),
        0 24px 90px rgba(15, 23, 42, 0.16);
    backdrop-filter: blur(24px) saturate(1.18) brightness(0.96);
    -webkit-backdrop-filter: blur(24px) saturate(1.18) brightness(0.96);
}

.article-detail-view-with-page-background .article-detail-content :deep(h1),
.article-detail-view-with-page-background .article-detail-content :deep(h2),
.article-detail-view-with-page-background .article-detail-content :deep(h3),
.article-detail-view-with-page-background .article-detail-content :deep(h4),
.article-detail-view-with-page-background .article-detail-content :deep(h5),
.article-detail-view-with-page-background .article-detail-content :deep(h6),
.article-detail-view-with-page-background
    .article-detail-content
    :deep(strong) {
    color: var(--article-page-background-heading-color, #fff) !important;
    mix-blend-mode: var(--article-page-background-text-blend-mode, normal);
    text-shadow: var(
        --article-page-background-heading-shadow,
        0 2px 18px rgba(0, 0, 0, 0.42)
    );
}

.article-detail-view-with-page-background .article-detail-content :deep(p),
.article-detail-view-with-page-background .article-detail-content :deep(li),
.article-detail-view-with-page-background .article-detail-content :deep(td),
.article-detail-view-with-page-background .article-detail-content :deep(th) {
    color: var(
        --article-page-background-body-color,
        rgba(255, 255, 255, 0.9)
    ) !important;
    mix-blend-mode: var(--article-page-background-text-blend-mode, normal);
}

.article-detail-view-with-page-background .article-detail-content :deep(a) {
    color: var(
        --article-page-background-link-color,
        rgba(191, 219, 254, 0.98)
    ) !important;
    text-decoration-color: color-mix(
        in srgb,
        var(--article-page-background-link-color, rgba(191, 219, 254, 0.98)) 48%,
        transparent
    );
}

.article-detail-view-with-page-background
    .article-detail-content
    :deep(a:hover) {
    color: var(--article-page-background-link-hover-color, #fff) !important;
}

.article-detail-view-with-page-background
    .article-detail-content
    :deep(blockquote) {
    color: var(
        --article-page-background-quote-color,
        rgba(255, 255, 255, 0.82)
    ) !important;
    background: var(
        --article-page-background-quote-bg,
        rgba(15, 23, 42, 0.18)
    ) !important;
    border-left-color: var(
        --article-page-background-quote-border,
        rgba(255, 255, 255, 0.38)
    ) !important;
}

.article-detail-view-with-page-background
    .article-detail-content
    :deep(code:not(pre code)) {
    border: 1px solid rgba(147, 197, 253, 0.24);
    background: rgba(255, 255, 255, 0.1) !important;
    color: var(
        --article-page-background-code-color,
        rgba(219, 234, 254, 0.98)
    ) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.14),
        0 8px 22px rgba(2, 6, 23, 0.12);
    text-shadow: none;
}

.article-detail-view-with-page-background .article-detail-license,
.article-detail-view-with-page-background .article-detail-related,
.article-detail-view-with-page-background :deep(.article-sponsor-section),
.article-detail-view-with-page-background :deep(.article-comment-section) {
    border-color: rgba(255, 255, 255, 0.18) !important;
    background: rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.88) !important;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        0 18px 54px rgba(2, 6, 23, 0.12) !important;
    backdrop-filter: blur(18px) saturate(1.12) brightness(0.92);
    -webkit-backdrop-filter: blur(18px) saturate(1.12) brightness(0.92);
}

.article-detail-view-with-page-background .article-detail-license *,
.article-detail-view-with-page-background .article-detail-related *,
.article-detail-view-with-page-background :deep(.article-sponsor-section *),
.article-detail-view-with-page-background :deep(.article-comment-section *) {
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.34);
}

.article-detail-view-with-page-background .article-detail-license p,
.article-detail-view-with-page-background .article-detail-license a,
.article-detail-view-with-page-background .article-detail-related-heading,
.article-detail-view-with-page-background .article-detail-related-title,
.article-detail-view-with-page-background :deep(.article-sponsor-title),
.article-detail-view-with-page-background :deep(.article-comment-title) {
    color: #fff !important;
}

.article-detail-view-with-page-background .article-detail-related-date,
.article-detail-view-with-page-background .article-detail-related-muted,
.article-detail-view-with-page-background :deep(.article-sponsor-description),
.article-detail-view-with-page-background :deep(.article-sponsor-note),
.article-detail-view-with-page-background :deep(.article-comment-description) {
    color: rgba(255, 255, 255, 0.78) !important;
}

.article-detail-view-with-page-background .article-detail-related-card,
.article-detail-view-with-page-background :deep(.article-sponsor-primary),
.article-detail-view-with-page-background :deep(.article-sponsor-method) {
    border-color: rgba(255, 255, 255, 0.14) !important;
    background: rgba(255, 255, 255, 0.08) !important;
}

:global(.dark .article-detail-page-background)::after {
    background:
        linear-gradient(
            180deg,
            rgba(2, 6, 23, 0.58) 0%,
            rgba(2, 6, 23, 0.44) 18rem,
            rgba(2, 6, 23, 0.38) 34rem,
            rgba(2, 6, 23, 0.46) 100%
        ),
        radial-gradient(
            circle at 18% 8%,
            rgba(255, 255, 255, 0.06),
            transparent 30%
        );
}

:global(.dark .article-detail-view-with-page-background .article-detail-content) {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
}

:global(.dark .article-detail-view-page-background-transparent .article-detail-content) {
    border-color: rgba(226, 232, 240, 0.08);
    background: transparent;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.06),
        0 10px 42px rgba(0, 0, 0, 0.08);
}

:global(.dark .article-detail-view-page-background-glass .article-detail-content) {
    border-color: rgba(226, 232, 240, 0.12);
    background:
        linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.16),
            rgba(15, 23, 42, 0.04)
        ),
        rgba(15, 23, 42, 0.02);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 24px 90px rgba(0, 0, 0, 0.22);
}

:global(.dark .article-detail-view-with-page-background .article-detail-content)
    :deep(code:not(pre code)) {
    border-color: rgba(147, 197, 253, 0.22);
    background: rgba(255, 255, 255, 0.08) !important;
}

.article-detail-header-with-background {
    position: relative;
    min-height: clamp(18rem, 42vw, 30rem);
    overflow: hidden;
    border-radius: 1.25rem;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    align-items: flex-end;
    padding: clamp(1.5rem, 4vw, 3rem);
    color: #fff;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
}

.article-detail-header-background-overlay {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
        linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.24) 0%,
            rgba(15, 23, 42, 0.58) 46%,
            rgba(15, 23, 42, 0.9) 100%
        ),
        radial-gradient(
            circle at 16% 18%,
            rgba(255, 255, 255, 0.16),
            transparent 34%
        );
    pointer-events: none;
}

.article-detail-header-content {
    position: relative;
    z-index: 1;
    width: min(100%, 48rem);
}

.article-detail-header-with-background :deep(.article-detail-category) {
    border-color: rgba(255, 255, 255, 0.42);
    background: rgba(255, 255, 255, 0.18);
    color: #fff !important;
    box-shadow: none;
    backdrop-filter: blur(12px);
}

.article-detail-header-with-background .article-detail-title {
    color: #fff !important;
    text-shadow: 0 3px 22px rgba(0, 0, 0, 0.46);
}

.article-detail-header-with-background .article-detail-meta {
    color: rgba(255, 255, 255, 0.9) !important;
}

.article-detail-header-with-background .article-detail-meta-item {
    color: rgba(255, 255, 255, 0.9) !important;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.36);
}

.article-detail-header-with-background .article-detail-meta-item svg,
.article-detail-header-with-background .article-detail-meta-item span {
    color: inherit !important;
}

@media (max-width: 640px) {
    .article-detail-header {
        margin-bottom: 1.5rem;
    }

    .article-detail-title {
        margin-bottom: 0.85rem;
        font-size: 1.75rem;
        line-height: 1.2;
    }

    .article-detail-meta {
        gap: 0.45rem 1rem;
        font-size: 0.8rem;
        line-height: 1.4;
    }

    .article-detail-page-background::after {
        background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.62) 0%,
            rgba(15, 23, 42, 0.52) 18rem,
            rgba(15, 23, 42, 0.48) 100%
        );
    }

    .article-detail-view-with-page-background {
        margin: -0.75rem;
        padding: 0.75rem;
        border-radius: 1.25rem;
    }

    .article-detail-view-with-page-background .article-detail-header {
        padding-top: 2.75rem;
    }

    .article-detail-view-with-page-background .article-detail-content {
        padding: 1rem;
        border-radius: 1rem;
    }

    .article-detail-view-page-background-glass .article-detail-content {
        backdrop-filter: blur(14px) saturate(1.1);
        -webkit-backdrop-filter: blur(14px) saturate(1.1);
    }

    .article-detail-header-with-background {
        min-height: 15rem;
        border-radius: 1rem;
        padding: 1.1rem;
    }

    .article-detail-cover,
    .article-detail-cover-placeholder,
    .article-detail-outdated,
    .article-detail-content,
    .article-detail-tags-wrap {
        margin-bottom: 1.5rem;
    }

    .article-detail-cover-placeholder {
        min-height: 12rem;
    }

    .article-detail-outdated,
    .article-detail-license {
        padding: 1rem;
        border-radius: 1rem;
    }

    .article-detail-license {
        margin-bottom: 2rem;
        overflow-wrap: anywhere;
    }

    .article-detail-content :deep(blockquote) {
        margin-inline: 0;
    }

    .article-detail-content :deep(iframe) {
        min-height: 12rem;
    }

    .article-detail-shell :deep(.article-sponsor-section),
    .article-detail-shell :deep(.article-comment-section) {
        margin-bottom: 2.5rem;
        padding: 1rem;
        border-radius: 1.2rem;
    }
}

.article-detail-cover-placeholder {
    display: flex;
    min-height: 16rem;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 0.75rem;
    color: rgb(37 99 235);
    background:
        radial-gradient(
            circle at 18% 18%,
            rgba(191, 219, 254, 0.82),
            transparent 34%
        ),
        linear-gradient(
            135deg,
            rgba(239, 246, 255, 0.96),
            rgba(248, 250, 252, 0.96)
        );
}

.article-detail-cover-placeholder[data-placeholder="icon"] {
    color: rgb(148 163 184);
    background: rgba(248, 250, 252, 0.96);
}

:global(.dark .article-detail-cover-placeholder) {
    color: rgb(147 197 253);
    background:
        radial-gradient(
            circle at 18% 18%,
            rgba(30, 64, 175, 0.42),
            transparent 34%
        ),
        linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.86));
}

:global(.dark .article-detail-cover-placeholder[data-placeholder="icon"]) {
    color: rgb(100 116 139);
    background: rgba(15, 23, 42, 0.9);
}

.article-detail-related {
    padding: 1.15rem;
    border: 1px solid rgba(226, 232, 240, 0.82);
    border-radius: 1.5rem;
    background:
        radial-gradient(
            circle at top left,
            rgba(219, 234, 254, 0.2),
            transparent 32%
        ),
        linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.92),
            rgba(248, 250, 252, 0.86)
        );
    box-shadow: 0 18px 46px rgba(15, 23, 42, 0.06);
}

.article-detail-related-head {
    margin-bottom: 1rem;
}

.article-detail-related-kicker {
    margin: 0 0 0.45rem;
    color: rgb(148 163 184);
    font-size: 0.72rem;
    font-weight: 760;
    letter-spacing: 0.18em;
    text-transform: uppercase;
}

.article-detail-related-heading {
    margin: 0;
    color: rgb(15 23 42);
    font-size: clamp(1.18rem, 2vw, 1.45rem);
    font-weight: 780;
    line-height: 1.25;
    letter-spacing: -0.03em;
}

.article-detail-related-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.95rem;
}

.article-detail-related-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid rgba(226, 232, 240, 0.82);
    border-radius: 1.15rem;
    background: rgba(255, 255, 255, 0.82);
    transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.article-detail-related-card:hover {
    transform: translateY(-2px);
    border-color: rgba(37, 99, 235, 0.22);
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.article-detail-related-link {
    display: flex;
    height: 100%;
    min-width: 0;
    flex-direction: column;
    color: inherit;
    text-decoration: none;
}

.article-detail-related-image,
.article-detail-related-placeholder {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    background:
        radial-gradient(
            circle at 18% 18%,
            rgba(191, 219, 254, 0.82),
            transparent 34%
        ),
        linear-gradient(
            135deg,
            rgba(239, 246, 255, 0.96),
            rgba(248, 250, 252, 0.96)
        );
}

.article-detail-related-image {
    object-fit: cover;
}

.article-detail-related-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(37 99 235);
}

.article-detail-related-placeholder[data-placeholder="icon"] {
    color: rgb(148 163 184);
    background: rgba(248, 250, 252, 0.96);
}

.article-detail-related-body {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    padding: 0.95rem;
}

.article-detail-related-meta,
.article-detail-related-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.42rem;
}

.article-detail-related-meta {
    margin-bottom: 0.65rem;
}

.article-detail-related-chip,
.article-detail-related-tag {
    display: inline-flex;
    align-items: center;
    min-height: 1.35rem;
    border: 1px solid rgba(226, 232, 240, 0.82);
    border-radius: 999px;
    background: rgba(248, 250, 252, 0.82);
    padding: 0 0.48rem;
    color: rgb(37 99 235);
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
}

.article-detail-related-muted,
.article-detail-related-date {
    color: rgb(100 116 139);
    font-size: 0.78rem;
    line-height: 1.45;
}

.article-detail-related-title {
    display: -webkit-box;
    margin: 0 0 0.55rem;
    overflow: hidden;
    color: rgb(15 23 42);
    font-size: 1rem;
    font-weight: 760;
    line-height: 1.42;
    letter-spacing: -0.02em;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.article-detail-related-date {
    margin: auto 0 0.7rem;
}

.article-detail-related-tags {
    margin-top: auto;
}

.article-detail-related-tag {
    color: rgb(71 85 105);
    font-size: 0.7rem;
    font-weight: 650;
}

:global(.dark .article-detail-related) {
    border-color: rgba(51, 65, 85, 0.8);
    background:
        radial-gradient(
            circle at top left,
            rgba(30, 64, 175, 0.2),
            transparent 32%
        ),
        linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78));
}

:global(.dark .article-detail-related-heading),
:global(.dark .article-detail-related-title) {
    color: rgb(241 245 249);
}

:global(.dark .article-detail-related-card) {
    border-color: rgba(51, 65, 85, 0.78);
    background: rgba(15, 23, 42, 0.72);
}

:global(.dark .article-detail-related-chip),
:global(.dark .article-detail-related-tag) {
    border-color: rgba(71, 85, 105, 0.72);
    background: rgba(15, 23, 42, 0.56);
    color: rgb(147 197 253);
}

:global(.dark .article-detail-related-date),
:global(.dark .article-detail-related-muted) {
    color: rgb(148 163 184);
}

@media (max-width: 640px) {
    .article-detail-related {
        padding: 0.85rem;
        border-radius: 1.2rem;
    }

    .article-detail-related-grid {
        grid-template-columns: minmax(0, 1fr);
        gap: 0.75rem;
    }

    .article-detail-related-card {
        border-radius: 1rem;
    }

    .article-detail-related-link {
        display: grid;
        grid-template-columns: minmax(6rem, 0.42fr) minmax(0, 1fr);
    }

    .article-detail-related-image,
    .article-detail-related-placeholder {
        height: 100%;
        min-height: 8.2rem;
        aspect-ratio: auto;
    }

    .article-detail-related-body {
        padding: 0.8rem;
    }

    .article-detail-related-title {
        font-size: 0.95rem;
    }

    .article-detail-related-tags {
        display: none;
    }
}

.article-detail-cover-watermark {
    position: absolute;
    z-index: 2;
    max-width: min(75%, 24rem);
    padding: 0.42rem 0.72rem;
    border-radius: 9999px;
    background: rgba(15, 23, 42, 0.58);
    color: white;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: 0.04em;
    backdrop-filter: blur(10px);
    pointer-events: none;
}

.article-detail-cover-watermark-top-left {
    top: 1rem;
    left: 1rem;
}

.article-detail-cover-watermark-top-right {
    top: 1rem;
    right: 1rem;
}

.article-detail-cover-watermark-bottom-left {
    bottom: 1rem;
    left: 1rem;
}

.article-detail-cover-watermark-bottom-right {
    right: 1rem;
    bottom: 1rem;
}
</style>
