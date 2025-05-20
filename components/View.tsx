import React from 'react'

import Ping from "@/components/Ping";
import { client, clientNoCache } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import { after } from "next/server";

const View = async ({ query, id }: { query: string, id: string }) => {
  const { views: totalViews } = await clientNoCache.fetch(query, { id });

  after(async () => await writeClient
    .patch(id)
    .set({ views: totalViews + 1 })
    .commit()
  )

  return (

    <div className={"view-container right-3"}>
      <div className={"absolute -top-2 -right-2"}>
        <Ping />
      </div>
      <p className={"view-text"}>
        <span className={"font-black"}>
          {totalViews} views
        </span>
      </p>
    </div>
  )
}
export default View
