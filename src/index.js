const request	= require( './request' );


/**
 *      all sdks
 *      @type {string[]}
 */
const SDKS	= ['alidns', 'cdn', 'cloudpush', 'cs', 'dm', 'drds', 'ecs', 'ess', 'httpdns', 'iot', 'metrics', 'mts', 'ram', 'rds', 'slb', 'sts', 'sms', 'dysms', 'dyvms'];
const DEFAULTS	= {
	AccessKeyId		: '',
	// Signature		: '',
	SignatureMethod		: 'HMAC-SHA1',
	Format			: 'json',
	// Version: '2014-05-26',
	SignatureVersion	: '1.0',
	SignatureNonce		: Math.random(),
	Timestamp		: new Date().toISOString()
};

const lazyLoad = ( sServiceName ) => ( oOptions ) =>
{
	const oSettings	= require( `./settings/${ sServiceName }` );
	oSettings.api	= oOptions.Api || oSettings.api;

	//	...
	return new Proxy({},
	{
		get : ( target, property ) =>
			( oOpts ) =>
			{
				const sAction = property.toLowerCase();
				if ( 'version' === sAction )
				{
					return oSettings.version;
				}

				let oParams	= Object.assign( {}, DEFAULTS, oOptions );
				oParams		= Object.assign( { Action : property }, oParams, oOpts );
				oParams.method	= oSettings.actions[ sAction ] || 'get';
				if ( undefined === oParams.Version )
				{
					oParams.Version = oSettings.version;
				}

				//	...
				return request( oSettings.api, oParams );
			}
	});
};

SDKS.forEach( ( sSdkName ) =>
{
	exports[ sSdkName ]	= lazyLoad( sSdkName );
	exports[ sSdkName.toUpperCase() ] = lazyLoad( sSdkName );
});
