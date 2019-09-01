#!/usr/bin/env ts-node

// tslint:disable:no-shadowed-variable
import test  from 'blue-tape'

import { PuppetMacpro } from './puppet-macpro'

class PuppetMacproTest extends PuppetMacpro {
}

// TODO: fix the test.
test('PuppetMacpro restart without problem', async (t) => {
  const puppet = new PuppetMacproTest({token: 'puppet_macpro_11cb7a1ae653s512'})
  try {
    for (let i = 0; i < 3; i++) {
      await puppet.start()
      await puppet.stop()
      t.pass('start/stop-ed at #' + i)
    }
    t.pass('PuppetMacpro() start/restart successed.')
  } catch (e) {
    t.fail(e)
  }
})
