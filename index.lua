-- [boundary.com] Process Memroy Usage Lua Plugin
-- [author] Ivano Picco <ivano.picco@pianobit.com>

-- Common requires.
local utils = require('utils')
local timer = require('timer')
local fs = require('fs')
local json = require('json')
local os = require ('os')
local tools = require ('tools')

local success, boundary = pcall(require,'boundary')
if (not success) then
  boundary = nil 
end

-- Business requires.
local string = require ("string")
local childProcess = require ('childprocess')
local table = require ('table')

local osType = string.lower(os.type())
local isWindows = osType == 'win32'
local isLinux   = osType == 'linux'

-- Default parameters.
local pollInterval = 10000
local source       = nil

-- Configuration.
local _parameters = (boundary and boundary.param ) or json.parse(fs.readFileSync('param.json')) or {}

_parameters.pollInterval = 
  (_parameters.pollInterval and tonumber(_parameters.pollInterval)>0  and tonumber(_parameters.pollInterval)) or
  pollInterval;

_parameters.source =
  (type(_parameters.source) == 'string' and _parameters.source:gsub('%s+', '') ~= '' and _parameters.source ~= nil and _parameters.source) or
  os.hostname()

-- Get current values.
function poll(cfg)
  --get stat
  tools.findProcStat(cfg,
    function (err,proc)
      if (err) then
        utils.debug(err)
        return
      end

      utils.print('MEM_PROCESS', proc.rss * 1024, cfg.source) --bytes
    end)
end

-- Ready, go.
if (#_parameters.items >0 ) then
  for _,item in ipairs(_parameters.items) do 
    item.source = item.source or _parameters.source --default hostname
    poll(item)
    timer.setInterval(_parameters.pollInterval,poll,item)
  end
else
  utils.debug("No configuration found")
end

