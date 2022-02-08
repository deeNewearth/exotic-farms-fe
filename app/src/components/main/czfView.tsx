
import { useState, useEffect } from 'react';
import { useAccountCtx, supportedChains, useConnectCalls } from '../web3';
import './main.scss';
import { Row, Col, Spinner } from "react-bootstrap";

import {formatCZfVal} from '../utils/display';
import { useExoticPools, useChronoPools } from '../pools';
import { IAsyncResult } from '../utils';


import { CZFarm } from '../../typechain/CZFarm';
import CZFarm_JSON from '../../typechain/CZFarm.json';

export default function CZFView() {

  const { account, networkId, nounce } = useAccountCtx();
  const { readOnly, connect } = useConnectCalls();
  const [czfBalance, setCzfBalance] = useState<IAsyncResult<string>>();

  const [accounStat,setAccountStat] = useState<{
    vested:number;
    czf:number;
  }>();

  const exoticPools = useExoticPools();
  const chronoPools = useChronoPools();

  useEffect(() => {

    (async () => {
      try {

        const chainInfo = networkId && supportedChains.find(n => n.chainId == networkId) || undefined;

        if (!chainInfo || undefined === account) {
          return;
        }

        setCzfBalance({ isLoading: true });

        const { web3ro } = await readOnly();

        const czFarm: CZFarm = new web3ro.eth.Contract(CZFarm_JSON.abi as any, chainInfo.contracts.czFarm) as any;
        const currBalance_Wei = await czFarm.methods.balanceOf(account).call();

        setCzfBalance({ result: web3ro.utils.fromWei(currBalance_Wei) });

      } catch (error: any) {
        setCzfBalance({ error });
      }

    })();

  }, [account, networkId, nounce]);

  useEffect(() => {

    const chainInfo = networkId && supportedChains.find(n => n.chainId == networkId) || undefined;

    if (!chainInfo || undefined === account || !chronoPools?.result || !exoticPools?.result) {
      return;
    }

    const allPools = [...Object.keys(exoticPools.result).map(k => ((exoticPools.result || {})[k]).pools).flat(), ...chronoPools?.result];

    const vested = allPools.map(p => {
      return p.harvestable ? Number.parseFloat(p.harvestable) : 0;
    }).reduce((a, b) => a + b);

    const czf = allPools.map(p => {
      return p.czf ? Number.parseFloat(p.czf) : 0;
    }).reduce((a, b) => a + b);

    setAccountStat({vested,czf});

  }, [account, networkId, nounce, chronoPools?.result, exoticPools?.result]);


  const czfData = [
      { val: formatCZfVal(czfBalance?.result), label: 'Your CZF' }, 
      { val: formatCZfVal(accounStat?.czf), label: 'CZF/day' },
      { val: '', label: 'Harvestable CZF' }, 
      { val: formatCZfVal(accounStat?.vested), label: 'CZF Vesting' }
  ];


  return <Row className="gap-3">
    {czfData.map((d, i) => <Col key={i} sm className="bg-light-mod text-center py-3">

      {czfBalance?.isLoading ? <Spinner animation="border" variant="primary" /> : <h4>{d.val}</h4>}

      <div>{d.label}</div>
    </Col>)}
  </Row>;

}