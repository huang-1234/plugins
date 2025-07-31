**腾讯高级前端工程师面试题**
*(基于性能监控SDK实现)*

### 一、前端性能监控原理与指标（25分）
1. **核心性能指标**：
   - 解释`FCP`、`LCP`、`TTI`、`CLS`、`INP`的定义和优化意义。
   - 代码中如何处理`LCP`的广告元素过滤？为什么需要这种处理？

2. **动态阈值机制**：
   ```typescript
   const mobileFactor = isMobile ? 1.3 : 1;
   if (metrics.FCP > threshold.FCP * mobileFactor) // ...
   ```
   - 分析该设计的目标，说明在移动端放宽阈值的合理性。

---

### 二、浏览器API与编码实践（35分）
1. **Performance Observer**：
   - 代码中同时监听了`paint`/`layout-shift`/`first-input`等多种事件类型：
     ```typescript
     new PerformanceObserver(/*...*/).observe({type: 'paint', buffered: true})
     ```
     - 解释`buffered: true`的作用和浏览器兼容性。
     - 为什么`INP`监听`event`类型而非专用类型？如何解决`durationThreshold`的类型断言问题？

2. **TTI计算逻辑**：
   ```typescript
   const quietPeriod = now - Math.max(this.metrics.LCP, lastLongTask);
   const quietThreshold = metrics.networkType?.includes?.('2g') ? 7000 : 5000;
   ```
   - 描述`quietPeriod`的计算原理，解释网络类型如何影响`quietThreshold`。

3. **内存管理**：
   - `dispose()`方法中为什么需要手动断开`PerformanceObserver`？不处理会导致什么隐患？

---

### 三、架构设计与工程化（30分）
1. **SPA适配机制**：
   ```typescript
   window.addEventListener('routeChange', () => this.resetForNextRoute());
   ```
   - 分析`resetForNextRoute()`的设计缺陷，如何优化多路由场景下的`CLS`累计问题？

2. **数据上报策略**：
   - 对比`navigator.sendBeacon`和`fetch + keepalive`的优劣。若后端接收延迟，如何确保数据不丢失？
   - `maxTime`超时上报可能导致什么问题？如何确保关键指标（如LCP）完整上报？

3. **异常处理**：
   - 代码中使用大量`@ts-ignore`和类型断言（如`as LayoutShift`），列举两种更安全的类型防护方案。

---

### 四、开放设计题（10分）
1. **性能监控SDK扩展**：
   - 当前SDK仅采集基础性能数据。若需添加「资源加载成功率」和「AJAX请求耗时分布」统计，简述实现方案（需包含关键代码结构）。

---

**参考答案要点提示**：
1. **LCP广告过滤**：避免广告内容作为主内容干扰真实用户体验评估。
2. **SPA的CLS重置问题**：需在路由切换时重置`clsValue`并重新绑定元素偏移监听。
3. **TTI静默期**：基于网络环境动态调整阈值，弱网环境下延长等待时间。
4. **类型安全改进**：使用条件类型（`in`操作符）校验`hadRecentInput`等实验性属性。

> *考察重点：指标理解深度、API底层原理、工程化设计能力、TypeScript实践水平*
>



前端性能指标的计算遵循一套严谨的原则和准则，旨在客观量化用户体验与技术性能的关系。以下是其核心计算逻辑及实践规范：

---

### ⚙️ **一、核心指标计算准则**
1. **以用户为中心的真实体验测量**
   - **LCP（最大内容渲染时间）**：取视口内最大元素（如图片、文本块）完全渲染的时间点。计算时需过滤广告等非主体内容（如代码中通过`element.classList`排除广告容器）。
   - **CLS（累积布局偏移）**：累计所有非预期布局偏移的分数（偏移距离 × 影响区域占比），仅统计无用户交互的偏移（`hadRecentInput=false`）。
   - **INP（交互到下一次渲染延迟）**：取所有用户交互（点击、输入）中最长的响应延迟，需监听`event`类型并过滤低耗时操作（如`durationThreshold`）。

2. **阶段化网络与渲染分解**
   - **关键路径分解**：将加载过程拆分为可量化阶段：
     - DNS查询：`domainLookupEnd - domainLookupStart`
     - TCP连接：`connectEnd - connectStart`
     - TTFB（首字节时间）：`responseStart - requestStart`
   - **渲染里程碑**：
     - FCP（首次内容渲染）：通过`PerformanceObserver`监听`paint`事件，捕获`first-contentful-paint`条目；
     - TTI（可交互时间）：需满足主线程静默期（无长任务阻塞）且资源加载完成，弱网环境（如2G）静默期阈值从5秒延长至7秒。

---

### ⚙️ **二、技术实现原则**
1. **API标准化与兼容性处理**
   - 使用`PerformanceObserver`而非已废弃的`performance.timing`，通过`buffered:true`捕获历史条目，避免监听时机问题。
   - 跨域资源需添加`Timing-Allow-Origin`头，否则`Resource Timing API`返回0。

2. **动态阈值与环境感知**
   - 移动端性能阈值放宽30%（如`FCP阈值 = 基准值 × 1.3`），因移动设备CPU/网络波动更大。
   - CLS计算需区分设备视口尺寸，响应式布局中元素偏移影响比例按实际屏幕占比计算。

3. **数据完整性保障**
   - **SPA场景重置机制**：路由切换时需重置`CLS`累计值及性能指标（如`resetForNextRoute()`），避免跨路由污染数据。
   - **最终值修正**：LCP取多次渲染中的最大值（`entries.sort((a,b)=>b.startTime-a.startTime)[0]`），INP取98百分位数避免极端值干扰。

---

### ⚙️ **三、工程化准则**
1. **上报策略优化**
   - 优先使用`navigator.sendBeacon`异步上报，超时或失败时降级为`fetch+keepalive`。
   - `maxTime`超时上报（默认500ms）需结合`beforeunload/pagehide`事件补报关键指标，避免数据丢失。

2. **实验室与生产环境协同**
   - 开发阶段用`Lighthouse`模拟测试（实验室数据），生产环境通过`web-vitals`库采集真实用户数据（RUM）。
   - 类型安全：用条件类型（如`entry is LayoutShift`）替代`@ts-ignore`，验证实验性API属性。

---

### ⚙️ **四、行业标准与最佳实践**
| **指标** | **优秀标准** | **需优化阈值** | **计算工具**         |
|----------|--------------|----------------|----------------------|
| **FCP**  | <1.8s        | ≥3s            | `PerformanceObserver`+`paint`类型 |
| **LCP**  | <2.5s        | ≥4s            | `largest-contentful-paint`监听 |
| **CLS**  | <0.1         | ≥0.25          | 累加`layout-shift`事件 |
| **INP**  | <200ms       | ≥500ms         | `event`事件过滤 |

---

### 💎 **总结**
前端性能指标的计算核心在于：**用户感知量化**（如LCP/CLS）、**技术过程分解**（如TTFB/TTI）、**环境动态适配**（设备/网络阈值）。实践中需结合标准化API、数据修正策略及跨环境验证，确保指标真实反映用户体验。优化时优先解决“指标三角”：加载速度（LCP）、交互响应（INP）、视觉稳定性（CLS），才能系统性提升用户留存。