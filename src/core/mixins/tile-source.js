import { isFunction, isString, constant, pick } from 'lodash/fp'
import {
  CACHE_SIZE,
  CROSS_ORIGIN,
  EPSG_3857,
  MAX_ZOOM,
  MIN_ZOOM,
  PIXEL_RATIO,
  REPROJ_ERR_THRESHOLD,
  TILE_SIZE,
} from '../ol-ext/consts'
import * as extentHelper from '../ol-ext/extent'
import * as tileGridHelper from '../ol-ext/tile-grid'
import replaceTokens from '../utils/replace-tokens'
import source from './source'
import * as assert from '../utils/assert'

const props = {
  cacheSize: {
    type: Number,
    default: CACHE_SIZE,
  },
  crossOrigin: {
    type: String,
    default: CROSS_ORIGIN,
  },
  maxZoom: {
    type: Number,
    default: MAX_ZOOM,
  },
  minZoom: {
    type: Number,
    default: MIN_ZOOM,
  },
  opaque: Boolean,
  projection: {
    type: String,
    default: EPSG_3857,
  },
  reprojectionErrorThreshold: {
    type: Number,
    default: REPROJ_ERR_THRESHOLD,
  },
  tilePixelRatio: {
    type: Number,
    default: PIXEL_RATIO,
  },
  tileSize: {
    type: Array,
    default: () => [TILE_SIZE, TILE_SIZE],
    validator: value => value.length === 2,
  },
  url: {
    type: [String, Function],
    required: true,
  },
}

const computed = {
  /**
   * @type {ol.TileUrlFunctionType}
   */
  urlFunc () {
    if (isFunction(this.url)) {
      return this.url
    }
    return constant(this.urlTmpl)
  },
  /**
   * @type {string}
   */
  urlTmpl () {
    if (!isString(this.url)) {
      return ''
    }
    return replaceTokens(this.url, pick(this.urlTokens, this))
  },
  /**
   * @type {string[]}
   */
  urlTokens () { return [] },
}

const methods = {
  /**
   * @return {ol.tilegrid.TileGrid}
   * @protected
   */
  createTileGrid () {
    assert.hasView(this)

    return tileGridHelper.createXYZ({
      extent: extentHelper.fromProjection(this.$view.getProjection()),
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      tileSize: this.tileSize,
    })
  },
  /**
   * @return {Promise}
   * @protected
   */
  init () {
    /**
     * @type {ol.tilegrid.TileGrid}
     * @protected
     */
    this._tileGrid = this.createTileGrid()

    return this::source.methods.init()
  },
  /**
   * @return {void|Promise<void>}
   * @protected
   */
  deinit () {
    this._tileGrid = undefined

    return this::source.methods.deinit()
  },
  /**
   * @return {void}
   * @protected
   */
  mount () {
    this::source.methods.mount()
  },
  /**
   * @return {void}
   * @protected
   */
  unmount () {
    this::source.methods.mount()
  },
}

const watch = {
  urlFunc (value) {
    if (this.$source && this.$source.getTileUrlFunction() !== value) {
      this.$source.setTileUrlFunction(value)
    }
  },
  urlTmpl (value) {
    if (this.$source && !this.$source.getUrls().includes(value)) {
      this.$source.setUrl(value)
    }
  },
}

export default {
  mixins: [source],
  props,
  computed,
  methods,
  watch,
}
