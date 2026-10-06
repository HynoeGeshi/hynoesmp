/*! Copyright © 2026 Hynoe. All rights reserved. See /COPYRIGHT.md. */
import {recoveryResult} from './save-recovery.mjs?v=20261006c';

if(recoveryResult.recovered){
  try{
    const key='hynoeSaveRecoveryReloadedV1';
    if(sessionStorage.getItem(key)!=='1'){
      sessionStorage.setItem(key,'1');
      location.reload();
    }
  }catch{}
}
