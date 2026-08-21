import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AdminConfigFields from '../../src/site/admin/components/AdminConfigFields.vue'

let wrapper

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('AdminConfigFields', () => {
  it('emits an immutable model update when a switch changes', async () => {
    const model = { enabled: false, title: '公告' }
    wrapper = mount(AdminConfigFields, {
      props: {
        modelValue: model,
        rootModel: model,
        path: 'announcement'
      }
    })

    await wrapper.get('[role="switch"]').trigger('click')

    const nextModel = wrapper.emitted('update:modelValue')[0][0]
    expect(nextModel).not.toBe(model)
    expect(nextModel).toEqual({ enabled: true, title: '公告' })
    expect(model.enabled).toBe(false)
  })

  it('adds a complete template to an empty repeatable list', async () => {
    const model = { social_links: [] }
    wrapper = mount(AdminConfigFields, {
      props: {
        modelValue: model,
        rootModel: model,
        path: 'profile'
      }
    })

    await wrapper.get('[aria-label="新增社交链接"]').trigger('click')

    const nextModel = wrapper.emitted('update:modelValue')[0][0]
    expect(nextModel.social_links).toHaveLength(1)
    expect(nextModel.social_links[0]).toMatchObject({
      name: '',
      url: '',
      enabled: true
    })
  })

  it('only renders fields for the selected provider', async () => {
    const model = {
      provider: '',
      respect_dnt: true,
      umami: { website_id: '' },
      plausible: { domain: '' }
    }
    wrapper = mount(AdminConfigFields, {
      props: {
        modelValue: model,
        rootModel: model,
        path: 'analytics'
      }
    })

    expect(wrapper.find('#admin-field-analytics-umami-website_id').exists()).toBe(false)
    expect(wrapper.find('#admin-field-analytics-plausible-domain').exists()).toBe(false)

    await wrapper.get('select').setValue('umami')
    const nextModel = wrapper.emitted('update:modelValue')[0][0]
    await wrapper.setProps({ modelValue: nextModel, rootModel: nextModel })

    expect(wrapper.find('#admin-field-analytics-umami-website_id').exists()).toBe(true)
    expect(wrapper.find('#admin-field-analytics-plausible-domain').exists()).toBe(false)
  })

  it('shows inactive feature details only after enabling the feature', async () => {
    const model = { enabled: false, mode: 'gradient', gradient_light: '' }
    wrapper = mount(AdminConfigFields, {
      props: {
        modelValue: model,
        rootModel: model,
        path: 'background'
      }
    })

    expect(wrapper.text()).not.toContain('模式')

    await wrapper.get('[role="switch"]').trigger('click')
    const nextModel = wrapper.emitted('update:modelValue')[0][0]
    await wrapper.setProps({ modelValue: nextModel, rootModel: nextModel })

    expect(wrapper.text()).toContain('模式')
    expect(wrapper.text()).toContain('浅色渐变')
    expect(wrapper.text()).not.toContain('浅色背景图')
  })
})
