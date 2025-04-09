// --- JS示例：Header动态收缩 + 鼠标拖尾 ---

// 清理旧元素和监听器 (简易版)
function cleanupElementAndListeners(id) {
    const existingElement = document.getElementById(id);
    if (existingElement) existingElement.remove();
    // 实际项目中移除监听器需要更精确，这里假设脚本只执行一次或重新执行会覆盖
  }
  window.removeEventListener('scroll', window._headerScrollHandler); // 移除旧的滚动监听
  window.removeEventListener('mousemove', window._cursorTrailHandler); // 移除旧的鼠标监听
  cleanupElementAndListeners('cursor-trail-container');
  
  console.log('%c应用高效果JS定制脚本...', 'color: orange; font-weight: bold;');
  
  /* 1. Header 滚动时显著收缩 */
  (function() {
    const header = document.querySelector('header.sticky');
    const blogTitle = header ? header.querySelector('a.text-xl') : null; // 选择博客标题链接
    const blogDescription = header ? header.querySelector('p.text-sm') : null; // 选择博客描述
  
    if (!header) {
      console.warn('Header 元素未找到，无法应用收缩效果。');
      return;
    }
  
    const headerInitialHeight = header.offsetHeight;
    const shrinkThreshold = 80; // 滚动多少距离后开始收缩
  
    // 添加过渡效果，让变化平滑
    header.style.transition = 'height 0.3s ease, padding 0.3s ease, background-color 0.3s ease';
    if(blogTitle) blogTitle.style.transition = 'font-size 0.3s ease, transform 0.3s ease';
    if(blogDescription) blogDescription.style.transition = 'opacity 0.3s ease, height 0.3s ease, visibility 0.3s ease';
  
  
    window._headerScrollHandler = () => {
      const scrollY = window.pageYOffset;
      if (scrollY > shrinkThreshold) {
        if (!header.classList.contains('header-shrunk')) {
          header.classList.add('header-shrunk');
          header.style.height = '55px'; // 收缩后的高度
          header.style.paddingTop = '0.25rem'; // 减少上下内边距
          header.style.paddingBottom = '0.25rem';
          header.style.backgroundColor = 'rgba(var(--color-dark-background), 0.98)'; // 强制深色背景
          if (blogTitle) {
              blogTitle.style.fontSize = '1rem'; // 缩小标题字号
              blogTitle.style.transform = 'translateY(-2px)'; // 轻微上移
          }
          if (blogDescription) {
              blogDescription.style.opacity = '0'; // 隐藏描述
              blogDescription.style.height = '0';
              blogDescription.style.visibility = 'hidden';
          }
          console.log('Header 已收缩');
        }
      } else {
        if (header.classList.contains('header-shrunk')) {
          header.classList.remove('header-shrunk');
          header.style.height = ''; // 恢复自动高度
          header.style.paddingTop = ''; // 恢复内边距
          header.style.paddingBottom = '';
          header.style.backgroundColor = ''; // 恢复默认背景
           if (blogTitle) {
              blogTitle.style.fontSize = ''; // 恢复字号
               blogTitle.style.transform = '';
          }
           if (blogDescription) {
              blogDescription.style.opacity = ''; // 恢复显示
              blogDescription.style.height = '';
              blogDescription.style.visibility = '';
          }
          console.log('Header 已恢复');
        }
      }
    };
  
    window.addEventListener('scroll', window._headerScrollHandler);
    console.log('Header 收缩效果已启用。');
  
  })();
  
  
  /* 2. 添加炫酷的鼠标拖尾效果 */
  (function() {
    const trailContainer = document.createElement('div');
    trailContainer.id = 'cursor-trail-container';
    trailContainer.style.position = 'fixed';
    trailContainer.style.top = '0';
    trailContainer.style.left = '0';
    trailContainer.style.width = '100%';
    trailContainer.style.height = '100%';
    trailContainer.style.pointerEvents = 'none'; // 不阻挡鼠标事件
    trailContainer.style.zIndex = '9999';
    document.body.appendChild(trailContainer);
  
    const trailColor = 'rgba(51, 255, 51, 0.7)'; // 拖尾颜色 (绿色)
    const trailSize = 8; // 拖尾元素大小
    const fadeOutTime = 500; // 毫秒
  
    window._cursorTrailHandler = (e) => {
      const trailDot = document.createElement('div');
      trailDot.className = 'cursor-trail-dot';
      trailDot.style.position = 'absolute';
      trailDot.style.width = `${trailSize}px`;
      trailDot.style.height = `${trailSize}px`;
      trailDot.style.left = `${e.pageX - trailSize / 2}px`;
      trailDot.style.top = `${e.pageY - trailSize / 2}px`;
      trailDot.style.backgroundColor = trailColor;
      trailDot.style.borderRadius = '50%';
      trailDot.style.opacity = '1';
      trailDot.style.transition = `opacity ${fadeOutTime}ms ease-out`;
  
      trailContainer.appendChild(trailDot);
  
      // 延迟移除并开始淡出
      setTimeout(() => {
        trailDot.style.opacity = '0';
        // 在动画结束后彻底移除DOM元素
        setTimeout(() => {
          if (trailContainer.contains(trailDot)) {
            trailContainer.removeChild(trailDot);
          }
        }, fadeOutTime);
      }, 10); // 稍微延迟一点点，确保元素已添加到DOM
    };
  
    window.addEventListener('mousemove', window._cursorTrailHandler);
    console.log('鼠标拖尾效果已启用。');
  
  })();
  