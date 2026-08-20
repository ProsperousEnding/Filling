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
})
