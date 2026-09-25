import React from "react"

import Styles from "./page.module.css"
import { ViewBill } from "@tolokoban/bill"
import { BILLS } from "./bills"

export default function PageBill() {
    return (
        <div className={Styles.bill}>
            <h1>Factures relatives au projet</h1>
            {BILLS.map(bill => <div>
                <h2>{bill.title}</h2>
                <ViewBill value={bill} />
            </div>
            )}
        </div>
    )
}
