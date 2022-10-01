import { useSync } from '../sync'

describe('useSync', () => {
	test('remote create should local create', async () => {
		const remote = {
			list: jest.fn(() => [{ id: 1 }]),
		}
		const [local, localSet] = [[], jest.fn()]

		expect(remote.list()).toEqual([{ id: 1 }])
		const db = useSync([local, localSet], remote)
		expect(db.list()).toEqual([])
		await db.sync()
		expect(localSet).toBeCalledWith([{ id: 1 }])
	})

	test('remote delete should local delete', async () => {
		const remote = {
			list: jest.fn(() => []),
		}
		const [local, localSet] = [[{ id: 1 }], jest.fn()]

		expect(remote.list()).toEqual([])
		const db = useSync([local, localSet], remote)
		expect(db.list()).toEqual([{ id: 1 }])
		await db.sync()
		expect(localSet).toBeCalledWith([])
	})

	test('local create should cache', async () => {
		const remote = {
			list: jest.fn(() => []),
		}
		const [local, localSet] = [[], jest.fn()]

		const db = useSync([local, localSet], remote)
		await db.create({ id: 1 })
		expect(localSet).toBeCalledWith([{ id: 1, sync: 'create' }])
	})

	test('local update should cache', async () => {
		const remote = {
			list: jest.fn(() => [{ id: 1 }]),
		}
		const [local, localSet] = [[{ id: 1 }], jest.fn()]

		const db = useSync([local, localSet], remote)
		await db.update({ id: 1, a: 1 })
		expect(localSet).toBeCalledWith([{ id: 1, a: 1, sync: 'update' }])
	})

	test('local create should remote create', async () => {
		const remote = {
			list: jest.fn(() => []),
			create: jest.fn(x => x),
		}
		const [local, localSet] = [[{ id: 1, sync: 'create' }], jest.fn()]

		const db = useSync([local, localSet], remote)
		await db.sync()
		expect(localSet).toBeCalledWith([{ id: 1 }])
		expect(remote.create).toBeCalledWith({ id: 1 })
	})

	test('local combo should remote combo', async () => {
		const remote = {
			list: jest.fn(() => [{ id: 0 }]),
			create: jest.fn(x => x),
			update: jest.fn(x => x),
			destroy: jest.fn(),
		}
		const [local, localSet] = [[
			{ id: 0 },
			{ id: 1 },
			{ id: 2, sync: 'destroy' },
			{ id: 3, sync: 'create' },
			{ id: 4, sync: 'update', a: 1 },
		], jest.fn()]

		const db = useSync([local, localSet], remote)
		await db.sync()
		expect(remote.destroy).toBeCalledWith({ id: 2 })
		expect(remote.create).toBeCalledWith({ id: 3 })
		expect(remote.update).toBeCalledWith({ id: 4, a: 1 })
		expect(localSet).toBeCalledWith([{ id: 0 }, { id: 3 }, { id: 4, a: 1 }])
	})

	test('local create then update should create', async () => {
		const remote = {
		}
		const [local, localSet] = [[
			{ id: 1, sync: 'create' },
		], jest.fn()]

		const db = useSync([local, localSet], remote)
		await db.update({ id: 1, a: 1 })
		expect(localSet).toBeCalledWith([{ id: 1, a: 1, sync: 'create' }])
	})

	test('local create then destroy should remove', async () => {
		const remote = {
		}
		const [local, localSet] = [[
			{ id: 1, sync: 'create' },
		], jest.fn()]

		const db = useSync([local, localSet], remote)
		await db.destroy({ id: 1 })
		expect(localSet).toBeCalledWith([])
	})

	test('local update then destroy should destroy', async () => {
		const remote = {
		}
		const [local, localSet] = [[
			{ id: 1, sync: 'update' },
		], jest.fn()]

		const db = useSync([local, localSet], remote)
		await db.destroy({ id: 1 })
		expect(localSet).toBeCalledWith([{ id: 1, sync: 'destroy' }])
	})
})
