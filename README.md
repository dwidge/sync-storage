# sync-storage

A small library for the browser that stores an array of objects or a single object in offline local storage, and syncs with a REST api like json-server, or a custom api.

# usage

## install

```
npm i github:dwidge/sync-storage
```

## invoke

```js
import { useSyncStorage, useRemote } from "@dwidge/sync-storage";

const store = useSyncStorage(remote, localStorageKey, defaultValue);

store.sync();
```

## sync functions

- list()
- get({id,...})
- create({...})
- update({id,...})
- destroy({id})
- sync()

## custom remote

- list()\*
- get({id,...})
- create({...})
- update({id,...})
- destroy({id})

* required

# examples

## array

```js
import React from "react";
import { useSyncStorage, useRemote } from "@dwidge/sync-storage";

const apiurl = "http://localhost:3050";

const App = () => {
  const users = useSyncStorage(
    useRemote(`${apiurl}/users`),
    "localstorage_users",
    []
  );

  users.sync();
  console.log(users.list()); //[{id:1},{id:2}]
};
```

## singleton

```js
const App = () => {
  const options = useSyncStorage(
    useRemote(`${apiurl}/options`),
    "localstorage_options",
    {}
  );

  console.log(options.list()); //{}
  options.sync();
  console.log(options.list()); //{a:1,b:2}
};
```

## custom remote

```js
const useCustomRemote = (url, accessToken) => {
  const list = async () => {
    const r = await (
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      })
    ).json();
    if (r.success) return [r.lesson];
  };

  const update = async (body) => {
    return (
      await fetch(url + "/update", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ accessToken, body }),
      })
    ).json();
  };

  return { list, update };
};

const App = () => {
  const options = useSyncStorage(
    useCustomRemote(`${apiurl}/options`, accessToken),
    "localstorage_options",
    {}
  );

  console.log(options.list()); //{}
  options.sync();
  console.log(options.list()); //{a:1,b:2}
  options.update({ a: 2, c: 3 });
  console.log(options.list()); //{a:2,c:3}
};
```

# todo

- handle merge conflicts

# license

Copyright 2022 DWJ

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
