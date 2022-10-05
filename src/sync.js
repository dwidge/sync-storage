import useLocalStorageState from 'use-local-storage-state'

export const useRemote = (url, { id = 'id' } = {}) => {
	const getId = body =>
		body[id] || ''

	const list = async () =>
		(await fetch(url)).json()

	const get = async (body) =>
		(await fetch(url + '/' + getId(body))).json()

	const create = async (body) => {
		console.log('POST')
		return (await fetch(url, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
			},
			body: JSON.stringify(body),
			f: console.log(body),
		})).json()
	}

	const update = async (body) => {
		console.log('PUT')
		return (await fetch(url + '/' + getId(body), {
			method: 'PUT',
			headers: {
				'Content-type': 'application/json',
			},
			body: JSON.stringify(body),
		})).json()
	}

	const destroy = async (body) => {
		console.log('DELETE')
		await fetch(url + '/' + getId(body), {
			method: 'DELETE',
		})
	}

	return { list, get, create, update, destroy }
}

export const useLocalList = ([state, stateSet], { id = 'id', status = 'sync' } = {}) => {
	const list = () =>
		state.filter(l => l[status] !== 'destroy')

	const get = (body) =>
		list().find(l => l[id] === body[id])

	const create = (body) => {
		const pending = o =>
			({ ...body, [status]: 'create' })
		stateSet(state.concat(pending(body)))
		return body
	}

	const update = (body) => {
		const pending = o =>
			o[status] === 'create' ? { ...body, [status]: 'create' } : { ...body, [status]: 'update' }

		stateSet(state.map(o => o[id] === body[id] ? pending(o) : o))
		return body
	}

	const destroy = (body) => {
		const pending = o =>
			o[status] === 'create' ? undefined : { ...o, [status]: 'destroy' }
		stateSet(state.map(o => !body || o[id] === body[id] ? pending(o) : o).filter(o => o))
	}

	const sync = async (rest) => {
		const remote = await rest.list()

		const localOnly = state.filter(l => !remote.some(r => r[id] === l[id]))

		const isPending = o =>
			o && o[status]

		const findLocal = (r) =>
			state.find(l => l[id] === r[id])

		const pickLocalIfPending = (l, r) =>
			isPending(l) ? l : r

		const all = remote.map(r => pickLocalIfPending(findLocal(r), r)).concat(...localOnly.filter(isPending))

		stateSet((await sequencial(
			all.map(({ [status]: s, ...o }) => () => rest[s] ? rest[s](o) : o,
			),
		)).filter(o => o))
	}

	return { list, get, create, update, destroy, sync }
}

const sequencial = async (arr) => {
	const out = []
	for (const v of arr) {
		out.push(await v())
	}
	return out
}

export const useLocalSingleton = ([state, stateSet], { status = 'sync' } = {}) => {
	const list = () => state

	const update = (body) => {
		body = { ...body, [status]: 'update' }
		stateSet(body)
		return body
	}

	const sync = async (rest) => {
		if (state[status] === 'update') {
			const { [status]: s, ...body } = state
			await rest.update(body)
			stateSet(body)
		} else {
			const remote = await rest.list()
			stateSet({ ...state, ...remote })
		}
	}

	return { list, update, sync }
}

export const useSync = (remote, [state, stateSet]) => {
	const useLocal = Array.isArray(state) ? useLocalList : useLocalSingleton

	const { sync, ...local } = useLocal([state, stateSet])
	return { ...local, sync: () => sync(remote) }
}

export const useSyncStorage = (remote, lsKey, defaultValue = []) => {
	const [state, stateSet, { removeItem, isPersistent }] = useLocalStorageState(lsKey, { defaultValue })
	return { ...useSync(remote, [state, stateSet]), reset: removeItem, isPersistent }
}
