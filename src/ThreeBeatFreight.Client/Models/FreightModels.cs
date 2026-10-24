using System.Text.Json;
using System.Text.Json.Serialization;
namespace ThreeBeatFreight.Client.Models;
public sealed class Point { public int X {get;set;} public int Y {get;set;} }
public sealed class Arena { public string Id {get;set;}=""; public string Title {get;set;}=""; public string Description {get;set;}=""; public List<string> Tiles {get;set;}=[]; public List<Point> Docks {get;set;}=[]; public List<Point> Sources {get;set;}=[]; }
public sealed class Contract { public string Id {get;set;}=""; public string Title {get;set;}=""; public string ArenaId {get;set;}=""; public string Brief {get;set;}=""; public string Hint {get;set;}=""; public int Deliveries {get;set;} public int Rounds {get;set;} public int MaximumFalls {get;set;} }
public sealed class Courier { public string Id {get;set;}=""; public string Alias {get;set;}=""; public int Seat {get;set;} public int X {get;set;} public int Y {get;set;} public int Score {get;set;} public int Falls {get;set;} public string? Cargo {get;set;} }
public sealed class Cargo { public string Id {get;set;}=""; public int X {get;set;} public int Y {get;set;} }
public sealed class Match { public Arena Board {get;set;}=new(); public string Phase {get;set;}=""; public string Mode {get;set;}=""; public int Round {get;set;} public int RoundLimit {get;set;} public List<Courier> Players {get;set;}=[]; public List<Cargo> Crates {get;set;}=[]; public Result? Result {get;set;} }
public sealed class Result { public List<string> Winners {get;set;}=[]; public int Rounds {get;set;} }
public sealed class Frame { public int Beat {get;set;} public List<Courier> Players {get;set;}=[]; public List<Cargo> Crates {get;set;}=[]; public List<JsonElement> Events {get;set;}=[]; }
public sealed class Replay { public int Round {get;set;} public List<Frame> Frames {get;set;}=[]; public Dictionary<string,List<Command>> Plans {get;set;}=[]; public List<string> AutomaticWaits {get;set;}=[]; }
public sealed class Command { public string Kind {get;set;}="wait"; public string? Direction {get;set;} [JsonIgnore] public string Label => Kind=="move"?"Step "+Direction:Kind=="shove"?"Shove "+Direction:Kind=="brace"?"Brace":"Wait"; [JsonIgnore] public int Cost => Kind=="shove"?2:Kind=="wait"?0:1; }
public sealed class User { public string Id {get;set;}=""; public string Alias {get;set;}=""; }
public sealed class RoomSummary { public string Id {get;set;}=""; public string Phase {get;set;}=""; public string Title {get;set;}=""; }
public sealed class Room { public string Id {get;set;}=""; public string HostId {get;set;}=""; public string Phase {get;set;}=""; public int Round {get;set;} public int Version {get;set;} public long? Deadline {get;set;} public long ServerNow {get;set;} public Arena Arena {get;set;}=new(); public Match? State {get;set;} public List<User> Members {get;set;}=[]; public List<string> CommittedIds {get;set;}=[]; public List<Command>? OwnPlan {get;set;} public Replay? Replay {get;set;} }
public sealed class Daily { public string Day {get;set;}=""; public string ContractId {get;set;}=""; }
public sealed class View { public bool Theatre {get;set;} public List<Replay> AvailableReplays {get;set;}=[]; public bool Practice {get;set;} public Daily Daily {get;set;}=new(); public string Origin {get;set;}=""; public List<Arena> Arenas {get;set;}=[]; public List<Contract> Contracts {get;set;}=[]; public User? User {get;set;} public List<RoomSummary> Rooms {get;set;}=[]; public Match? State {get;set;} public Replay? Replay {get;set;} public Room? Room {get;set;} public string? RecoveryKey {get;set;} public string Invite {get;set;}=""; public string ContractId {get;set;}=""; public string Notice {get;set;}=""; public List<Record> Records {get;set;}=[]; public bool ServiceAvailable {get;set;} }
public sealed class Record { public string ContractId {get;set;}=""; public int Rounds {get;set;} public int Deliveries {get;set;} public int Falls {get;set;} public string CompletedAt {get;set;}=""; }





