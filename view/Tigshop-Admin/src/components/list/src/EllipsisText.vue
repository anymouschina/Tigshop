<template>
  <div v-if="type==='div'" class="ellipsis-text" :style="ellipsisStyle">{{ text }}</div>
  <a v-else-if="type==='a'" class="ellipsis-text" :style="ellipsisStyle">{{ text }}</a>
</template>

<script>
export default {
  props: {
    text: String,
    type:{
      type:String,
      default:'div'
    },
    maxLines: Number,
  },
  computed: {
    ellipsisStyle() {
      if (this.maxLines) {
        return {
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': `${this.maxLines}`,
          overflow: 'hidden',
        };
      }
      return {};
    },
  },
};
</script>

<style lang="less" scoped>
.ellipsis-text {
  /* 可以自定义其他样式 */
}
</style>
